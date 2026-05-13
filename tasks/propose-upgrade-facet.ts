import { FunctionFragment } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { GnosisSafeAdminClient } from '../helpers/gnosis-safe'

interface ProposeUpgradeFacetArgs {
  facet: string
  args?: string
  safe?: string
  facetAddress?: string
}

const proposeUpgradeFacet = async (
  args: ProposeUpgradeFacetArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const {
    deployments: { getArtifact },
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

  const artifact = await getArtifact(args.facet)
  let facetAddress: string

  if (args.facetAddress) {
    // Reuse an already-deployed facet
    facetAddress = args.facetAddress
    log(`Using existing facet at ${facetAddress}`, { indent: 2, star: true })
  } else {
    // Deploy the new facet using ethers directly (hardhat-deploy has
    // a compat issue with ethers v5 formatter on contract creation txs)
    const constructorArgs: any[] = args.args ? JSON.parse(args.args) : []
    const [signer] = await ethers.getSigners()
    const factory = new ethers.ContractFactory(
      artifact.abi,
      artifact.bytecode,
      signer
    )
    const facetContract = await factory.deploy(...constructorArgs)
    await facetContract.waitForDeployment()
    facetAddress = await facetContract.getAddress()
    log(`Facet deployed at ${facetAddress}`, { indent: 2, star: true })
  }

  // Get function selectors from the facet ABI
  const iface = new ethers.Interface(artifact.abi)
  const selectors = iface.fragments
    .filter((f): f is FunctionFragment => f.type === 'function')
    .map((f) => f.selector)

  log(`Found ${selectors.length} function selectors`, {
    indent: 2,
    star: true,
  })

  // Get the TellerDiamond address
  const diamondDeployment = await hre.deployments.get('TellerDiamond')
  const diamondAddress = diamondDeployment.address

  // Encode diamondCut() calldata
  const diamondCutIface = new ethers.Interface([
    'function diamondCut(tuple(address facetAddress, uint8 action, bytes4[] functionSelectors)[] _diamondCut, address _init, bytes _calldata)',
  ])

  const calldata = diamondCutIface.encodeFunctionData('diamondCut', [
    [
      {
        facetAddress: facetAddress,
        action: 1, // FacetCutAction.Replace
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
  .setAction(proposeUpgradeFacet)
