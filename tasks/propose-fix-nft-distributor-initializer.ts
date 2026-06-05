import { FunctionFragment } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { GnosisSafeAdminClient } from '../helpers/gnosis-safe'

interface ProposeFixArgs {
  nft?: string
  admin?: string
  safe?: string
  facetAddress?: string
}

/**
 * Remediation for audit finding C-1 (NFTDistributor ADMIN takeover).
 *
 * The `initializer` modifier never set `initialized = true`, so the
 * `initialize(address,address)` selector on the NFTDistributor diamond is
 * callable by anyone — letting an attacker overwrite the NFT pointer and
 * grant themselves the ADMIN role.
 *
 * This task proposes a SINGLE Gnosis Safe transaction (signed via Ledger)
 * that atomically:
 *   1. Replaces the `ent_initialize_NFTDistributor_v1` facet with the fixed
 *      build (the modifier now flips the `initialized` flag).
 *   2. Calls `initialize(nft, admin)` in the same `diamondCut` via the
 *      `_init` / `_calldata` delegatecall — flipping `initialized` to `true`
 *      and re-asserting the correct NFT pointer + ADMIN holder.
 *
 * Because both steps run in one transaction there is no window in which the
 * fixed-but-still-unlocked contract is exposed to a front-run.
 */
const proposeFixNFTDistributorInitializer = async (
  args: ProposeFixArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const {
    deployments: { getArtifact },
    getNamedAccounts,
    ethers,
    log,
    network,
  } = hre

  const facetName = 'ent_initialize_NFTDistributor_v1'

  const { deployer, safeAddress: defaultSafeAddress } =
    await getNamedAccounts()
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

  // Get the NFTDistributor diamond
  const diamondDeployment = await hre.deployments.get('TellerNFTDistributor')
  const diamondAddress = diamondDeployment.address

  log('')
  log('Proposing NFTDistributor initializer fix (audit C-1)', {
    indent: 1,
    star: true,
  })
  log(`Diamond: ${diamondAddress}`, { indent: 2, star: true })
  log(`Safe:    ${safeAddress}`, { indent: 2, star: true })

  // Resolve the locking-init arguments.
  //  - admin defaults to the Safe so the multisig owns the ADMIN role.
  //  - nft defaults to the value currently stored on the diamond so we never
  //    silently re-point the distributor at a different collection.
  const distributor = await ethers.getContractAt(
    'ITellerNFTDistributor',
    diamondAddress
  )
  const currentNft: string = await distributor.nft()

  const nft = args.nft ?? currentNft
  const admin = args.admin ?? safeAddress

  log(`Lock call: initialize(${nft}, ${admin})`, { indent: 2, star: true })
  if (nft.toLowerCase() !== currentNft.toLowerCase()) {
    log(
      `WARNING: nft (${nft}) differs from the on-chain value (${currentNft})`,
      { indent: 2, star: true }
    )
  }

  // Deploy the fixed facet (or reuse an already-deployed one).
  const artifact = await getArtifact(facetName)
  let facetAddress: string

  if (args.facetAddress) {
    facetAddress = args.facetAddress
    log(`Using existing facet at ${facetAddress}`, { indent: 2, star: true })
  } else {
    // Deploy via ethers directly (hardhat-deploy has an ethers-v5 formatter
    // compat issue on contract-creation txs — mirrors propose-upgrade-facet).
    const [signer] = await ethers.getSigners()
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer
    )
    const facetContract = await factory.deploy()
    await facetContract.waitForDeployment()
    facetAddress = await facetContract.getAddress()
    log(`Fixed facet deployed at ${facetAddress}`, { indent: 2, star: true })
  }

  // The facet also exposes an inherited `grantRole` selector, but only
  // `initialize` carries the bug — replace exactly that one selector to keep
  // the cut minimal and avoid touching unrelated routing.
  const iface = new ethers.Interface(artifact.abi)
  const initFragment = iface.fragments.find(
    (f): f is FunctionFragment =>
      f.type === 'function' && (f as FunctionFragment).name === 'initialize'
  )
  if (!initFragment) {
    throw new Error('initialize() not found in facet ABI')
  }
  const selectors = [initFragment.selector]

  log(`Replacing selector ${initFragment.selector} (initialize)`, {
    indent: 2,
    star: true,
  })

  // The locking init call, delegatecalled by diamondCut after the replace.
  const initCalldata = iface.encodeFunctionData('initialize', [nft, admin])

  // Encode diamondCut() — Replace the facet AND run initialize() atomically
  // via _init / _calldata.
  const diamondCutIface = new ethers.Interface([
    'function diamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)',
  ])

  const calldata = diamondCutIface.encodeFunctionData('diamondCut', [
    [
      {
        facetAddress,
        action: 1, // FacetCutAction.Replace
        functionSelectors: selectors,
      },
    ],
    facetAddress, // _init — delegatecall target (the fixed facet)
    initCalldata, // _calldata — initialize(nft, admin) → flips initialized=true
  ])

  log(`Encoded diamondCut calldata (${calldata.length} bytes)`, {
    indent: 2,
    star: true,
  })

  // Determine network name for the Safe API.
  let networkName = network.name
  if (networkName === 'hardhat' || networkName === 'localhost') {
    networkName = process.env.FORKING_NETWORK ?? 'mainnet'
  }

  // Propose to the Gnosis Safe (signed via Ledger inside the client).
  const safeClient = new GnosisSafeAdminClient({ apiKey })

  const result = await safeClient.proposeTransaction({
    safeAddress,
    to: diamondAddress,
    data: calldata,
    network: networkName,
  })

  log('Transaction proposed to Safe!', { indent: 1, star: true })
  log(`Safe TX Hash: ${result.safeTxHash}`, { indent: 2, star: true })
  log(`URL: ${result.url}`, { indent: 2, star: true })
}

task(
  'propose-fix-nft-distributor-initializer',
  'Deploy the fixed NFTDistributor initialize facet and propose an atomic ' +
    'diamondCut (replace + lock) via Gnosis Safe (audit C-1)'
)
  .addOptionalParam(
    'nft',
    'NFT address to set during the locking init (defaults to the current on-chain value)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'admin',
    'Address to (re)grant ADMIN during the locking init (defaults to the Safe)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'facetAddress',
    'Use an already-deployed facet address (skips deployment)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'safe',
    'Override the Gnosis Safe address',
    undefined,
    types.string
  )
  .setAction(proposeFixNFTDistributorInitializer)
