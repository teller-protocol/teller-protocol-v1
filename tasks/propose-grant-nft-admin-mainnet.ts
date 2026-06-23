import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { GnosisSafeAdminClient } from '../helpers/gnosis-safe'

interface GrantArgs {
  nft?: string
  newadmin?: string
  adminholder?: string
}

// keccak256("ADMIN")
const ADMIN_ROLE =
  '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42'

// The 1-of-1 Gnosis Safe that currently holds the ADMIN role on the mainnet
// MainnetTellerNFT (co-owned by the 3-of-6 multisig). It is the source of the
// grantRole proposal. Override with --adminholder (e.g. to use the deployer EOA
// path instead, which would be a plain `cast send`, not a Safe proposal).
const DEFAULT_ADMIN_HOLDER_SAFE = '0x8d8e821d918204d0f2101f01eef0438d05e14ff8'

const MAINNET_TELLER_NFT = '0x8f9bbbB0282699921372A134b63799a48c7d17FC'

/**
 * MAINNET NFT-recovery step 2 of 3 — grant the ADMIN role to the recovery Safe.
 *
 * On mainnet the ADMIN role is held by team-controlled addresses (the deployer
 * EOA + a 1-of-1 Safe co-owned by the 3-of-6 multisig), so no `recoverAdmin`
 * backdoor is needed — we re-seat ADMIN with the standard `grantRole`.
 *
 * This proposes `MainnetTellerNFT.grantRole(ADMIN, newAdmin)` to the
 * admin-holding Safe (default: the 1-of-1 `0x8d8e82…`). Once signed + executed,
 * `newAdmin` (default: the 3-of-6 recovery Safe) can run `return-stolen-nfts`.
 *
 * Cleanup (separate, optional): after granting, revoke the old holders via
 * `revokeRole(ADMIN, <deployer EOA / old Safe>)` from the new ADMIN holder.
 */
const proposeGrantNftAdminMainnet = async (
  args: GrantArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { getNamedAccounts, ethers, log, network } = hre

  const nftAddress = args.nft ?? MAINNET_TELLER_NFT
  const adminHolderSafe = args.adminholder ?? DEFAULT_ADMIN_HOLDER_SAFE

  const { safeAddress: defaultSafeAddress } = await getNamedAccounts()
  const newAdmin = args.newadmin ?? defaultSafeAddress
  if (!newAdmin) {
    throw new Error(
      'No newadmin configured. Pass --newadmin or set safeAddress in namedAccounts.'
    )
  }

  const apiKey = (hre.config as any).safe_api?.apiKey
  if (!apiKey) {
    throw new Error('SAFE_GLOBAL_API_KEY not set. Add it to your .env file.')
  }

  const nftIface = new ethers.Interface([
    'function grantRole(bytes32 role, address account)',
    'function hasRole(bytes32 role, address account) view returns (bool)',
  ])
  const nft = new ethers.Contract(nftAddress, nftIface, ethers.provider)

  log('')
  log('Proposing grantRole(ADMIN) on MainnetTellerNFT (recovery step 2)', {
    indent: 1,
    star: true,
  })
  log(`NFT:           ${nftAddress}`, { indent: 2, star: true })
  log(`Admin holder:  ${adminHolderSafe} (proposal source)`, {
    indent: 2,
    star: true,
  })
  log(`New ADMIN:     ${newAdmin}`, { indent: 2, star: true })

  // Guard: the proposing Safe must actually hold ADMIN, or grantRole reverts.
  const holderHasAdmin: boolean = await nft.hasRole(ADMIN_ROLE, adminHolderSafe)
  log(`Admin holder currently holds ADMIN: ${holderHasAdmin}`, {
    indent: 2,
    star: true,
  })
  if (!holderHasAdmin) {
    throw new Error(
      `Admin holder ${adminHolderSafe} does not hold ADMIN — grantRole would ` +
        'revert. Pass --adminholder with a current ADMIN-role address.'
    )
  }

  const alreadyAdmin: boolean = await nft.hasRole(ADMIN_ROLE, newAdmin)
  if (alreadyAdmin) {
    log(`Note: ${newAdmin} already holds ADMIN. Proposal is a no-op.`, {
      indent: 2,
      star: true,
    })
  }

  const data = nftIface.encodeFunctionData('grantRole', [ADMIN_ROLE, newAdmin])

  let networkName = network.name
  if (networkName === 'hardhat' || networkName === 'localhost') {
    networkName = process.env.FORKING_NETWORK ?? 'mainnet'
  }

  const safeClient = new GnosisSafeAdminClient({ apiKey })
  const result = await safeClient.proposeTransaction({
    safeAddress: adminHolderSafe,
    to: nftAddress,
    data,
    network: networkName,
  })

  log('')
  log('Transaction proposed to admin-holder Safe!', { indent: 1, star: true })
  log(`Safe TX Hash: ${result.safeTxHash}`, { indent: 2, star: true })
  log(`URL: ${result.url}`, { indent: 2, star: true })
  log('')
  log(`Once signed + executed, ${newAdmin} holds ADMIN and can run`, {
    indent: 1,
  })
  log('`return-stolen-nfts --send` (step 3).', { indent: 1 })
}

task(
  'propose-grant-nft-admin-mainnet',
  'Propose grantRole(ADMIN, newAdmin) on MainnetTellerNFT from the current ' +
    'ADMIN-holding Safe via Gnosis Safe (Ledger) — NFT recovery step 2'
)
  .addOptionalParam('nft', 'MainnetTellerNFT address', undefined, types.string)
  .addOptionalParam(
    'newadmin',
    'Address to grant ADMIN to (defaults to the recovery Safe / namedAccounts.safeAddress)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'adminholder',
    'Safe that currently holds ADMIN and sources the proposal',
    undefined,
    types.string
  )
  .setAction(proposeGrantNftAdminMainnet)
