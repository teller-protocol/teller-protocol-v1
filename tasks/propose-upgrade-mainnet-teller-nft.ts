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
 * MAINNET NFT-recovery step 1 of 3 — push the admin mint/burn/force-transfer
 * functions onto the live MainnetTellerNFT.
 *
 * `MainnetTellerNFT` (deployed on Ethereum at the TellerNFT_V2 proxy
 * `0x8f9bbbB0…`) is an OpenZeppelin *Transparent* upgradeable proxy, NOT a
 * diamond — so the new `adminMint` / `adminBurn` / `adminForceTransfer[Batch]`
 * selectors are added by swapping the implementation, not via `diamondCut`. The
 * proxy is owned by a `ProxyAdmin` contract; only `ProxyAdmin.owner()` (the
 * 3-of-6 Safe) may call `ProxyAdmin.upgrade(proxy, newImplementation)`.
 *
 * Unlike the Polygon flow, this is a PLAIN `upgrade` (no `upgradeAndCall` +
 * `recoverAdmin`): ADMIN on mainnet is already held by team-controlled addresses
 * (the deployer EOA + a 1-of-1 Safe co-owned by the multisig), so the role is
 * re-seated separately via `propose-grant-nft-admin-mainnet`
 * (`grantRole(ADMIN, Safe)`) — no proxy-admin backdoor is required.
 *
 * This task:
 *   1. Deploys the new `MainnetTellerNFT` implementation (or reuses --implementation).
 *   2. Asserts the Safe owns the ProxyAdmin (otherwise the proposal can't execute).
 *   3. Encodes `ProxyAdmin.upgrade(proxy, newImplementation)` and proposes it as a
 *      single Gnosis Safe transaction (signed via Ledger inside the client).
 *
 * After this executes: run `propose-grant-nft-admin-mainnet` (step 2) then
 * `return-stolen-nfts` (step 3).
 */
const proposeUpgradeMainnetTellerNFT = async (
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

  const contractName = 'MainnetTellerNFT'

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

  // Resolve the proxy + ProxyAdmin addresses (defaults from mainnet artifacts).
  const proxyDeployment =
    (await getOrNull('TellerNFT_V2')) ?? (await getOrNull('MainnetTellerNFT'))
  const proxyAddress = args.proxy ?? proxyDeployment?.address
  if (!proxyAddress) {
    throw new Error(
      'Could not resolve the MainnetTellerNFT proxy address. Pass --proxy.'
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
  log('Proposing MainnetTellerNFT implementation upgrade (recovery step 1)', {
    indent: 1,
    star: true,
  })
  log(`Proxy:       ${proxyAddress}`, { indent: 2, star: true })
  log(`ProxyAdmin:  ${proxyAdminAddress}`, { indent: 2, star: true })
  log(`Safe:        ${safeAddress}`, { indent: 2, star: true })

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

  let networkName = network.name
  if (networkName === 'hardhat' || networkName === 'localhost') {
    networkName = process.env.FORKING_NETWORK ?? 'mainnet'
  }

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
  log('Next: propose-grant-nft-admin-mainnet (step 2), then', { indent: 1 })
  log('return-stolen-nfts --send (step 3).', { indent: 1 })
}

task(
  'propose-upgrade-mainnet-teller-nft',
  'Deploy the new MainnetTellerNFT implementation (adminMint/adminBurn/' +
    'adminForceTransfer) and propose ProxyAdmin.upgrade via Gnosis Safe (Ledger) — recovery step 1'
)
  .addOptionalParam(
    'proxy',
    'MainnetTellerNFT proxy address (defaults to the TellerNFT_V2 deployment)',
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
  .setAction(proposeUpgradeMainnetTellerNFT)
