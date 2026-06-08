import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { GnosisSafeAdminClient } from '../helpers/gnosis-safe'

interface ProposeUpgradeArgs {
  proxy?: string
  proxyadmin?: string
  safe?: string
  implementation?: string
}

/**
 * NFT-recovery step 1 of 2 — push the admin mint/burn functions onto the live
 * PolyTellerNFT.
 *
 * `PolyTellerNFT` (deployed on Polygon at the TellerNFT_V2 proxy) is an
 * OpenZeppelin *Transparent* upgradeable proxy, NOT a diamond — so the new
 * `adminMint` / `adminBurn` / `adminBurnBatch` selectors are added by swapping
 * the implementation, not via `diamondCut`. The proxy is owned by a
 * `ProxyAdmin` contract; only `ProxyAdmin.owner()` may call
 * `ProxyAdmin.upgrade(proxy, newImplementation)`.
 *
 * This task:
 *   1. Deploys the new `PolyTellerNFT` implementation (or reuses one passed via
 *      --implementation).
 *   2. Reads the current implementation and the ProxyAdmin owner, asserting the
 *      Safe is actually the owner (otherwise the proposal could never execute).
 *   3. Encodes `ProxyAdmin.upgrade(proxy, newImplementation)` and proposes it as
 *      a single Gnosis Safe transaction (signed via Ledger inside the client).
 *
 * After this proposal is signed + executed, the ADMIN-role holder runs
 * `recover-stolen-nfts` to burn the attacker tokens and re-mint to victims.
 * NOTE: ADMIN was granted to the original deployer at init, not to the Safe —
 * see the recovery task / README before executing step 2.
 */
const proposeUpgradePolyTellerNFT = async (
  args: ProposeUpgradeArgs,
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

  const apiKey = (hre.config as any).safe_api?.apiKey
  if (!apiKey) {
    throw new Error('SAFE_GLOBAL_API_KEY not set. Add it to your .env file.')
  }

  // Resolve the proxy + ProxyAdmin addresses. Default to the recorded Polygon
  // deployment artifacts but allow explicit overrides.
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
  log('Proposing PolyTellerNFT implementation upgrade (NFT recovery step 1)', {
    indent: 1,
    star: true,
  })
  log(`Proxy:       ${proxyAddress}`, { indent: 2, star: true })
  log(`ProxyAdmin:  ${proxyAdminAddress}`, { indent: 2, star: true })
  log(`Safe:        ${safeAddress}`, { indent: 2, star: true })

  // ProxyAdmin minimal ABI — upgrade(proxy, impl), owner(), getProxyImplementation(proxy).
  const proxyAdminIface = new ethers.Interface([
    'function upgrade(address proxy, address implementation)',
    'function owner() view returns (address)',
    'function getProxyImplementation(address proxy) view returns (address)',
  ])
  const proxyAdmin = new ethers.Contract(
    proxyAdminAddress,
    proxyAdminIface,
    ethers.provider
  )

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
    const artifact = await getArtifact(contractName)
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

  // Encode ProxyAdmin.upgrade(proxy, newImplementation).
  const calldata = proxyAdminIface.encodeFunctionData('upgrade', [
    proxyAddress,
    implAddress,
  ])
  log(`Encoded upgrade calldata (${calldata.length} bytes)`, {
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
  log('Once signed + executed, run `recover-stolen-nfts` from the ADMIN-role', {
    indent: 1,
  })
  log('holder to burn attacker tokens and re-mint to victims.', { indent: 1 })
}

task(
  'propose-upgrade-poly-teller-nft',
  'Deploy the new PolyTellerNFT implementation (adminMint/adminBurn) and ' +
    'propose ProxyAdmin.upgrade via Gnosis Safe (Ledger-signed) — NFT recovery step 1'
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
  .setAction(proposeUpgradePolyTellerNFT)
