import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { FunctionFragment } from 'ethers'

const addRolesFacet = async (
  _args: Record<string, never>,
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
  log('========== Add Roles Facet to NFTDistributor ==========', { indent: 1 })
  log('')

  // 1. Deploy the new roles facet
  log('Deploying ent_roles_NFTDistributor_v1...', { indent: 1, star: true })
  const deployResult = await deploy('ent_roles_NFTDistributor_v1', {
    from: deployer,
    log: true,
  })
  log(`Roles facet deployed at ${deployResult.address}`, {
    indent: 2,
    star: true,
  })

  // 2. Get function selectors from the facet
  const artifact = await getArtifact('ent_roles_NFTDistributor_v1')
  const iface = new ethers.Interface(artifact.abi)
  const selectors = iface.fragments
    .filter((f): f is FunctionFragment => f.type === 'function')
    .map((f) => f.selector)

  log(`Function selectors: ${selectors.length}`, { indent: 2, star: true })
  for (const sel of selectors) {
    const fn = iface.getFunction(sel)
    log(`  ${sel} => ${fn?.name}`, { indent: 3 })
  }

  // 3. Get the NFTDistributor diamond
  const diamondDeployment = await hre.deployments.get('TellerNFTDistributor')
  const diamond = await ethers.getContractAt(
    'IDiamondCut',
    diamondDeployment.address,
    await ethers.provider.getSigner(deployer)
  )

  log(`NFTDistributor diamond: ${diamondDeployment.address}`, {
    indent: 1,
    star: true,
  })

  // 4. Add the roles facet via diamondCut
  log('Executing diamondCut (Add roles facet)...', { indent: 1, star: true })
  const cutTx = await diamond.diamondCut(
    [
      {
        facetAddress: deployResult.address,
        action: 0, // FacetCutAction.Add
        functionSelectors: selectors,
      },
    ],
    ethers.ZeroAddress,
    '0x'
  )
  const cutReceipt = await cutTx.wait()
  log(
    `diamondCut tx: ${cutReceipt.hash} (gas: ${cutReceipt.gasUsed.toString()})`,
    { indent: 2, star: true }
  )

  log('')
  log('SUCCESS: Roles facet added to NFTDistributor!', {
    indent: 1,
    star: true,
  })
  log(
    'You can now call revokeRole / grantRole on the diamond as the owner.',
    { indent: 1, star: true }
  )
}

task(
  'add-nft-distributor-roles-facet',
  'Deploy and add the owner-only roles facet to the NFTDistributor diamond'
)
  .setAction(addRolesFacet)
