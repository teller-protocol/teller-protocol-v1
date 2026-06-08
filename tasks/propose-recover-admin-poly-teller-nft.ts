import { FunctionFragment } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { GnosisSafeAdminClient } from '../helpers/gnosis-safe'

interface ProposeRecoverArgs {
  proxy?: string
  proxyadmin?: string
  safe?: string
  newadmin?: string
  implementation?: string
}

/**
 * NFT-recovery — atomically install the new PolyTellerNFT implementation
 * (adminMint/adminBurn + the one-shot recoverAdmin hook) AND re-seat the ADMIN
 * role onto an address we control, in a single Gnosis Safe (Ledger-signed) tx.
 *
 * Background: `PolyTellerNFT` (Polygon, transparent proxy at the TellerNFT_V2
 * proxy address) currently has its ERC1155 ADMIN role held by an address we no
 * longer wish to rely on. We DO control the proxy upgrade authority — the Safe
 * owns the `ProxyAdmin` — and upgrade rights outrank the role holder.
 *
 * This task encodes:
 *
 *   ProxyAdmin.upgradeAndCall(
 *     proxy,
 *     newImplementation,
 *     PolyTellerNFT.recoverAdmin(newAdmin)   // <- delegatecalled by the proxy
 *   )
 *
 * `upgradeAndCall` swaps the implementation and then delegatecalls
 * `recoverAdmin` from the proxy in the SAME transaction, with
 * `msg.sender == ProxyAdmin`. `recoverAdmin` is gated on exactly that, and a
 * transparent proxy never routes ordinary admin calls to the implementation, so
 * the hook is reachable only here, only once — it grants ADMIN to `newAdmin`
 * with no front-run window and leaves no standing backdoor.
 *
 * After this executes, use the standard `grantRole` / `revokeRole` from the new
 * ADMIN holder (e.g. `revokeRole(ADMIN, <oldHolder>)`) to finish cleanup, then
 * run `recover-stolen-nfts` to burn/re-mint.
 */
const proposeRecoverAdminPolyTellerNFT = async (
  args: ProposeRecoverArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const {
    deployments: { getArtifact, getOrNull },
    getNamedAccounts,
    ethers,
    log,
    network,
  } = hre

  const contractName = 'PolyTellerNFT'

  const { safeAddress: defaultSafeAddress } = await getNamedAccounts()
  const safeAddress = args.safe ?? defaultSafeAddress

  if (!safeAddress) {
    throw new Error(
      'No safe address configured. Pass --safe or set safeAddress in namedAccounts.'
    )
  }

  // ADMIN is re-seated onto the Safe by default — keep the role on the multisig
  // that already owns upgrades rather than a hot EOA.
  const newAdmin = args.newadmin ?? safeAddress

  const apiKey = (hre.config as any).safe_api?.apiKey
  if (!apiKey) {
    throw new Error('SAFE_GLOBAL_API_KEY not set. Add it to your .env file.')
  }

  // Resolve the proxy + ProxyAdmin addresses (defaults from the Polygon
  // deployment artifacts, overridable).
  const proxyDeployment =
    (await getOrNull('TellerNFT_V2')) ?? (await getOrNull('PolyTellerNFT'))
  const proxyAddress = args.proxy ?? proxyDeployment?.address
  if (!proxyAddress) {
    throw new Error(
      'Could not resolve the PolyTellerNFT proxy address. Pass --proxy.'
    )
  }

  const proxyAdminDeployment = await getOrNull('DefaultProxyAdmin')
  const proxyAdminAddress = args.proxyadmin ?? proxyAdminDeployment?.address
  if (!proxyAdminAddress) {
    throw new Error(
      'Could not resolve the ProxyAdmin address. Pass --proxyadmin.'
    )
  }

  log('')
  log('Proposing PolyTellerNFT upgrade + ADMIN recovery', {
    indent: 1,
    star: true,
  })
  log(`Proxy:       ${proxyAddress}`, { indent: 2, star: true })
  log(`ProxyAdmin:  ${proxyAdminAddress}`, { indent: 2, star: true })
  log(`Safe:        ${safeAddress}`, { indent: 2, star: true })
  log(`New ADMIN:   ${newAdmin}`, { indent: 2, star: true })

  // ProxyAdmin minimal ABI.
  const proxyAdminIface = new ethers.Interface([
    'function upgradeAndCall(address proxy, address implementation, bytes data) payable',
    'function owner() view returns (address)',
    'function getProxyImplementation(address proxy) view returns (address)',
  ])
  const proxyAdmin = new ethers.Contract(
    proxyAdminAddress,
    proxyAdminIface,
    ethers.provider
  )

  // Guard: the recoverAdmin hook checks `msg.sender == PROXY_ADMIN`, hardcoded
  // in the contract. Make sure the on-chain ProxyAdmin matches what we resolved,
  // or the delegatecall will revert.
  const HARDCODED_PROXY_ADMIN = '0x00BfeCF575FBDF4367dD70Dc9c729475173dBABf'
  if (proxyAdminAddress.toLowerCase() !== HARDCODED_PROXY_ADMIN.toLowerCase()) {
    throw new Error(
      `ProxyAdmin (${proxyAdminAddress}) != the PROXY_ADMIN hardcoded in ` +
        `PolyTellerNFT.recoverAdmin (${HARDCODED_PROXY_ADMIN}). The recover call ` +
        'would revert. Update the contract constant or pass the right --proxyadmin.'
    )
  }

  // Guard: the Safe must own the ProxyAdmin or the proposal can never execute.
  const proxyAdminOwner: string = await proxyAdmin.owner()
  log(`ProxyAdmin owner: ${proxyAdminOwner}`, { indent: 2, star: true })
  if (proxyAdminOwner.toLowerCase() !== safeAddress.toLowerCase()) {
    throw new Error(
      `ProxyAdmin owner (${proxyAdminOwner}) is not the Safe (${safeAddress}). ` +
        'The Safe cannot upgrade this proxy. Aborting.'
    )
  }

  const currentImpl: string = await proxyAdmin.getProxyImplementation(
    proxyAddress
  )
  log(`Current implementation: ${currentImpl}`, { indent: 2, star: true })

  // Deploy the new implementation (or reuse one passed in).
  const artifact = await getArtifact(contractName)
  let implAddress: string
  if (args.implementation) {
    implAddress = args.implementation
    log(`Using existing implementation at ${implAddress}`, {
      indent: 2,
      star: true,
    })
  } else {
    // Deploy via ethers directly (hardhat-deploy has an ethers-v5 formatter
    // compat issue on contract-creation txs — mirrors the other propose tasks).
    const [signer] = await ethers.getSigners()
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer
    )
    const implContract = await factory.deploy()
    await implContract.waitForDeployment()
    implAddress = await implContract.getAddress()
    log(`New implementation deployed at ${implAddress}`, {
      indent: 2,
      star: true,
    })
  }

  if (implAddress.toLowerCase() === currentImpl.toLowerCase()) {
    throw new Error(
      `New implementation (${implAddress}) equals the current one. Nothing to upgrade.`
    )
  }

  // Sanity: the new implementation must actually expose recoverAdmin.
  const nftIface = new ethers.Interface(artifact.abi)
  const recoverFragment = nftIface.fragments.find(
    (f): f is FunctionFragment =>
      f.type === 'function' && (f as FunctionFragment).name === 'recoverAdmin'
  )
  if (!recoverFragment) {
    throw new Error(
      'recoverAdmin(address) not found in the PolyTellerNFT ABI — recompile.'
    )
  }

  // recoverAdmin(newAdmin) — delegatecalled by the proxy during upgradeAndCall.
  const recoverCalldata = nftIface.encodeFunctionData('recoverAdmin', [newAdmin])

  // ProxyAdmin.upgradeAndCall(proxy, newImpl, recoverCalldata)
  const calldata = proxyAdminIface.encodeFunctionData('upgradeAndCall', [
    proxyAddress,
    implAddress,
    recoverCalldata,
  ])
  log(`Encoded upgradeAndCall calldata (${calldata.length} bytes)`, {
    indent: 2,
    star: true,
  })

  // Determine network name for the Safe API.
  let networkName = network.name
  if (networkName === 'hardhat' || networkName === 'localhost') {
    networkName = process.env.FORKING_NETWORK ?? 'polygon'
  }

  // Propose to the Gnosis Safe (signed via Ledger inside the client).
  const safeClient = new GnosisSafeAdminClient({ apiKey })

  const result = await safeClient.proposeTransaction({
    safeAddress,
    to: proxyAdminAddress,
    data: calldata,
    network: networkName,
  })

  log('')
  log('Transaction proposed to Safe!', { indent: 1, star: true })
  log(`Safe TX Hash: ${result.safeTxHash}`, { indent: 2, star: true })
  log(`URL: ${result.url}`, { indent: 2, star: true })
  log('')
  log('After signing + executing:', { indent: 1 })
  log(`  - ${newAdmin} now holds ADMIN on ${proxyAddress}`, { indent: 2 })
  log('  - revoke the previous holder via revokeRole(ADMIN, <oldHolder>)', {
    indent: 2,
  })
  log('  - then run `recover-stolen-nfts` to burn/re-mint', { indent: 2 })
}

task(
  'propose-recover-admin-poly-teller-nft',
  'Deploy the new PolyTellerNFT implementation and propose an atomic ' +
    'ProxyAdmin.upgradeAndCall (upgrade + recoverAdmin) via Gnosis Safe (Ledger)'
)
  .addOptionalParam(
    'newadmin',
    'Address to grant the ADMIN role to (defaults to the Safe)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'proxy',
    'PolyTellerNFT proxy address (defaults to the TellerNFT_V2 deployment)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'proxyadmin',
    'ProxyAdmin address (defaults to DefaultProxyAdmin deployment)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'implementation',
    'Use an already-deployed implementation address (skips deployment)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'safe',
    'Override the Gnosis Safe address',
    undefined,
    types.string
  )
  .setAction(proposeRecoverAdminPolyTellerNFT)
