import { FunctionFragment } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { GnosisSafeAdminClient } from '../helpers/gnosis-safe'

interface ProposeUpgradeFacetArgs {
  facet: string
  args?: string
  safe?: string
  diamond?: string
  action?: number
}

const proposeUpgradeFacet = async (
  args: ProposeUpgradeFacetArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const {
    deployments: { deploy, getArtifact },
    getNamedAccounts,
    ethers,
    log,
    network,
  } = hre

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
    throw new Error(
      'SAFE_GLOBAL_API_KEY not set. Add it to your .env file.'
    )
  }

  log('')
  log(`Proposing facet upgrade: ${args.facet}`, { indent: 1, star: true })
  log(`Safe: ${safeAddress}`, { indent: 2, star: true })

  // Parse constructor args if provided
  const constructorArgs: any[] = args.args ? JSON.parse(args.args) : []

  // Deploy the new facet
  const deployResult = await deploy(args.facet, {
    from: deployer,
    args: constructorArgs,
    log: true,
  })

  log(`Facet deployed at ${deployResult.address}`, { indent: 2, star: true })

  // Get function selectors from the facet ABI
  const artifact = await getArtifact(args.facet)
  const iface = new ethers.Interface(artifact.abi)
  const selectors = iface.fragments
    .filter((f): f is FunctionFragment => f.type === 'function')
    .map((f) => f.selector)

  log(`Found ${selectors.length} function selectors`, {
    indent: 2,
    star: true,
  })

  // Get the diamond address (defaults to TellerDiamond)
  const diamondName = args.diamond ?? 'TellerDiamond'
  const diamondDeployment = await hre.deployments.get(diamondName)
  const diamondAddress = diamondDeployment.address
  const facetAction = args.action ?? 1 // 0=Add, 1=Replace, 2=Remove
  const actionLabels = ['Add', 'Replace', 'Remove']
  log(`Diamond: ${diamondName} (${diamondAddress})`, { indent: 2, star: true })
  log(`Action: ${actionLabels[facetAction]} (${facetAction})`, { indent: 2, star: true })

  // Encode diamondCut() calldata
  const diamondCutIface = new ethers.Interface([
    'function diamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)',
  ])

  const calldata = diamondCutIface.encodeFunctionData('diamondCut', [
    [
      {
        facetAddress: deployResult.address,
        action: facetAction,
        functionSelectors: selectors,
      },
    ],
    ethers.ZeroAddress,
    '0x',
  ])

  log(`Encoded diamondCut calldata (${calldata.length} bytes)`, {
    indent: 2,
    star: true,
  })

  // Determine network name for Safe API
  let networkName = network.name
  if (networkName === 'hardhat' || networkName === 'localhost') {
    networkName = process.env.FORKING_NETWORK ?? 'mainnet'
  }

  // Propose to Gnosis Safe
  const safeClient = new GnosisSafeAdminClient({ apiKey })

  const result = await safeClient.proposeTransaction({
    safeAddress,
    to: diamondAddress,
    data: calldata,
    network: networkName,
  })

  log(`Transaction proposed to Safe!`, { indent: 1, star: true })
  log(`Safe TX Hash: ${result.safeTxHash}`, { indent: 2, star: true })
  log(`URL: ${result.url}`, { indent: 2, star: true })
}

task(
  'propose-upgrade-facet',
  'Deploy a facet and propose diamondCut() via Gnosis Safe'
)
  .addParam(
    'facet',
    'The contract name of the facet to upgrade',
    undefined,
    types.string
  )
  .addOptionalParam(
    'args',
    'Constructor arguments as a JSON array (e.g. \'["0x123..."]\')',
    undefined,
    types.string
  )
  .addOptionalParam(
    'safe',
    'Override the Gnosis Safe address',
    undefined,
    types.string
  )
  .addOptionalParam(
    'diamond',
    'Diamond contract name (default: TellerDiamond)',
    undefined,
    types.string
  )
  .addOptionalParam(
    'action',
    'FacetCutAction: 0=Add, 1=Replace, 2=Remove (default: 1)',
    undefined,
    types.int
  )
  .setAction(proposeUpgradeFacet)
