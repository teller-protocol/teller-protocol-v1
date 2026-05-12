import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

interface UpgradeFacetArgs {
  facet: string
  args?: string
}

const upgradeFacet = async (
  args: UpgradeFacetArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const {
    deployments: { deploy, getArtifact },
    getNamedAccounts,
    ethers,
    log,
  } = hre

  const { deployer } = await getNamedAccounts()

  log('')
  log(`Upgrading facet: ${args.facet}`, { indent: 1, star: true })

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
  const iface = new ethers.utils.Interface(artifact.abi)
  const selectors = Object.keys(iface.functions).map((fn) =>
    iface.getSighash(fn)
  )

  log(`Found ${selectors.length} function selectors`, {
    indent: 2,
    star: true,
  })

  // Get the TellerDiamond contract with diamondCut function
  const diamond = await ethers.getContractAt(
    'IDiamondCut',
    (await hre.deployments.get('TellerDiamond')).address,
    await ethers.provider.getSigner(deployer)
  )

  // Call diamondCut with action 1 (Replace)
  const tx = await diamond.diamondCut(
    [
      {
        facetAddress: deployResult.address,
        action: 1, // FacetCutAction.Replace
        functionSelectors: selectors,
      },
    ],
    ethers.constants.AddressZero,
    '0x'
  )

  const receipt = await tx.wait()

  log(
    `diamondCut() tx: ${receipt.transactionHash} (gas: ${receipt.gasUsed.toString()})`,
    { indent: 2, star: true }
  )
  log(`Facet ${args.facet} upgraded successfully!`, { indent: 1, star: true })
}

task('upgrade-facet', 'Deploy and replace a single diamond facet')
  .addParam('facet', 'The contract name of the facet to upgrade', undefined, types.string)
  .addOptionalParam(
    'args',
    'Constructor arguments as a JSON array (e.g. \'["0x123..."]\')',
    undefined,
    types.string
  )
  .setAction(upgradeFacet)
