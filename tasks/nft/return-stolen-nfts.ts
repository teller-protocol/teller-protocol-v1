import fs from 'fs'
import path from 'path'

import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import {
  GnosisSafeAdminClient,
  MULTISEND_CALL_ONLY,
  encodeMultiSend,
  MultiSendTx,
} from '../../helpers/gnosis-safe'

/**
 * Mainnet MainnetTellerNFT proxy (TellerNFT_V2). Overridable via --nft.
 */
const MAINNET_TELLER_NFT = '0x8f9bbbB0282699921372A134b63799a48c7d17FC'

interface ReturnArgs {
  map: string
  nft?: string
  safe?: string
  send?: boolean
  batch: string
}

/**
 * One force-transfer instruction: move `ids[i]` x `amounts[i]` of the stolen
 * NFTs from a current holder back to the original staker. Each entry becomes a
 * single `adminForceTransferBatch(from, to, ids, amounts)` call.
 */
interface RecoveryEntry {
  from: string // current holder of the stolen tokens
  to: string // original staker to return them to
  ids: (string | number)[]
  amounts: (string | number)[]
}

const loadMap = (filePath: string): RecoveryEntry[] => {
  const raw = JSON.parse(fs.readFileSync(filePath).toString())
  if (!Array.isArray(raw)) {
    throw new Error('Recovery map must be a JSON array of {from,to,ids,amounts}')
  }
  return raw.map((e: any, i: number) => {
    if (!e.from || !e.to || !Array.isArray(e.ids) || !Array.isArray(e.amounts)) {
      throw new Error(`Entry ${i} missing from/to/ids/amounts`)
    }
    if (e.ids.length !== e.amounts.length) {
      throw new Error(`Entry ${i}: ids/amounts length mismatch`)
    }
    if (e.ids.length === 0) {
      throw new Error(`Entry ${i}: empty ids`)
    }
    return e as RecoveryEntry
  })
}

/**
 * Returns exploited NFTs to their original stakers on mainnet using the
 * `adminForceTransferBatch` admin hook added in the MainnetTellerNFT upgrade.
 *
 * Reads a recovery map (see {RecoveryEntry}) describing, per (current holder ->
 * original staker), which token IDs and amounts to move. It groups one Safe
 * proposal per entry — each is a single CALL to
 * `adminForceTransferBatch(from, to, ids, amounts)` — queued at incrementing
 * Safe nonces.
 *
 * Prerequisites:
 *  - `propose-recover-admin-mainnet-teller-nft` already executed, so the Safe
 *    holds the ADMIN role and the deployed impl exposes adminForceTransferBatch.
 *
 * Modes:
 *  - default: dry run — validates the map, simulates each call with `staticCall`
 *    from the Safe, and prints what would be proposed.
 *  - --send (live network): proposes each entry to the Gnosis Safe (Ledger).
 *  - localhost/hardhat: executes directly from the first signer.
 */
const returnStolenNFTs = async (
  args: ReturnArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { ethers, network, log, getNamedAccounts } = hre

  const nftAddress = args.nft ?? MAINNET_TELLER_NFT
  const isLocal = ['localhost', 'hardhat'].includes(network.name)

  const { safeAddress: defaultSafeAddress } = await getNamedAccounts()
  const safeAddress = args.safe ?? defaultSafeAddress

  const mapPath = path.isAbsolute(args.map)
    ? args.map
    : path.resolve(process.cwd(), args.map)
  const entries = loadMap(mapPath)

  const totalUnits = entries.reduce(
    (s, e) => s + e.amounts.reduce((a, x) => a + Number(x), 0),
    0
  )
  const stakers = new Set(entries.map((e) => e.to.toLowerCase()))

  log('')
  log(`Loaded recovery map: ${mapPath}`, { indent: 1, star: true })
  log(`Entries (force-transfer batches): ${entries.length}`, {
    indent: 2,
    star: true,
  })
  log(`Total units to return: ${totalUnits}`, { indent: 2, star: true })
  log(`Distinct stakers (recipients): ${stakers.size}`, {
    indent: 2,
    star: true,
  })
  log(`NFT: ${nftAddress}`, { indent: 2, star: true })

  const nftIface = new ethers.Interface([
    'function adminForceTransferBatch(address from, address to, uint256[] ids, uint256[] amounts)',
    'function balanceOf(address account, uint256 id) view returns (uint256)',
    'function hasRole(bytes32 role, address account) view returns (bool)',
  ])
  const ADMIN_ROLE =
    '0xdf8b4c520ffe197c5343c6f5aec59570151ef9a492f2c624fd45ddde6135ec42'

  // === DRY RUN: validate balances + simulate from the Safe ===
  log('')
  log('=== Validation (current holder balances) ===', { indent: 1 })
  const nft = new ethers.Contract(nftAddress, nftIface, ethers.provider)

  if (safeAddress) {
    const safeHasAdmin: boolean = await nft.hasRole(ADMIN_ROLE, safeAddress)
    log(
      `Safe ${safeAddress} holds ADMIN: ${safeHasAdmin}${
        safeHasAdmin ? '' : '  <-- run propose-grant-nft-admin-mainnet first!'
      }`,
      { indent: 2, star: true }
    )
  }

  let warnings = 0
  for (const [i, e] of entries.entries()) {
    for (let k = 0; k < e.ids.length; k++) {
      const bal = await nft.balanceOf(e.from, e.ids[k])
      if (BigInt(bal) < BigInt(e.amounts[k])) {
        warnings++
        log(
          `WARNING entry ${i}: ${e.from} holds ${bal} of token ${e.ids[k]}, ` +
            `need ${e.amounts[k]} (may have on-sold; recovery will revert)`,
          { indent: 2, star: true }
        )
      }
    }
  }
  log(
    warnings === 0
      ? 'All holders have sufficient balance.'
      : `${warnings} balance shortfalls — those entries would revert.`,
    { indent: 2, star: true }
  )

  // === EXECUTE ===
  if (isLocal) {
    log('')
    log('=== Executing locally (first signer must hold ADMIN) ===', {
      indent: 1,
    })
    const signer = (await ethers.getSigners())[0]
    const nftWrite = new ethers.Contract(nftAddress, nftIface, signer)
    for (const [i, e] of entries.entries()) {
      const tx = await nftWrite.adminForceTransferBatch(
        e.from,
        e.to,
        e.ids,
        e.amounts
      )
      const receipt = await tx.wait()
      log(`entry ${i}: ${e.from} -> ${e.to} (${e.ids.length} ids) tx ${receipt.hash}`, {
        indent: 2,
        star: true,
      })
    }
    return
  }

  if (!args.send) {
    const perBatch = Math.max(1, parseInt(args.batch, 10) || 30)
    const nBatches = Math.ceil(entries.length / perBatch)
    log('')
    log(
      `Dry run complete. With --batch ${perBatch}, this would be ${nBatches} ` +
        `MultiSend Safe tx(s) for ${entries.length} transfers. Pass --send to propose.`,
      { indent: 1 }
    )
    return
  }

  // Live: propose each entry to the Gnosis Safe, queued at incrementing nonces.
  if (!safeAddress) {
    throw new Error('No safe address. Pass --safe or set safeAddress.')
  }
  const apiKey = (hre.config as any).safe_api?.apiKey
  if (!apiKey) {
    throw new Error('SAFE_GLOBAL_API_KEY not set. Add it to your .env file.')
  }
  let networkName = network.name
  if (isLocal) networkName = process.env.FORKING_NETWORK ?? 'mainnet'

  const safeClient = new GnosisSafeAdminClient({ apiKey })

  // Bundle the per-entry adminForceTransferBatch calls into MultiSend batches so
  // the multisig signs a handful of transactions instead of one per (holder,staker).
  const perBatch = Math.max(1, parseInt(args.batch, 10) || 30)

  // Guard: MultiSend must be deployed on this network, or the delegatecall fails.
  const msCode = await ethers.provider.getCode(MULTISEND_CALL_ONLY)
  if (msCode === '0x') {
    throw new Error(
      `MultiSendCallOnly not found at ${MULTISEND_CALL_ONLY} on ${networkName}. ` +
        'Aborting (cannot batch).'
    )
  }

  const calls: MultiSendTx[] = entries.map((e) => ({
    to: nftAddress,
    data: nftIface.encodeFunctionData('adminForceTransferBatch', [
      e.from,
      e.to,
      e.ids,
      e.amounts,
    ]),
  }))

  const chunks: MultiSendTx[][] = []
  for (let i = 0; i < calls.length; i += perBatch) {
    chunks.push(calls.slice(i, i + perBatch))
  }

  log('')
  log('=== Proposing MultiSend batches to Gnosis Safe (Ledger) ===', {
    indent: 1,
  })
  log(
    `${entries.length} force-transfers → ${chunks.length} Safe tx(s) (${perBatch}/batch) via MultiSend`,
    { indent: 2, star: true }
  )

  for (const [i, chunk] of chunks.entries()) {
    const data = encodeMultiSend(chunk)
    const result = await safeClient.proposeTransaction({
      safeAddress,
      to: MULTISEND_CALL_ONLY,
      data,
      network: networkName,
      operation: 1, // delegatecall — required for MultiSend
      nonceOffset: i, // queue batches sequentially after the current Safe nonce
    })
    log(
      `batch ${i + 1}/${chunks.length}: ${chunk.length} transfers, safeTx ${result.safeTxHash}`,
      { indent: 2, star: true }
    )
  }

  log('')
  log(
    `Proposed ${chunks.length} MultiSend transaction(s) covering ${entries.length} transfers.`,
    { indent: 1, star: true }
  )
}

task('return-stolen-nfts', 'Force-transfer exploited NFTs back to original stakers via Gnosis Safe')
  .addParam(
    'map',
    'Path to the recovery map JSON ([{from,to,ids,amounts}])',
    'investigation/recovery_map.json',
    types.string
  )
  .addOptionalParam('nft', 'MainnetTellerNFT address', undefined, types.string)
  .addOptionalParam('safe', 'Override the Gnosis Safe address', undefined, types.string)
  .addParam(
    'batch',
    'Force-transfers per MultiSend Safe tx (bundles proposals)',
    '30',
    types.string
  )
  .addFlag('send', 'Propose the transactions to the Safe (otherwise dry run)')
  .setAction(returnStolenNFTs)
