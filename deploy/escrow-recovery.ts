import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { ITellerDiamond } from '../types/typechain'
import { deploy } from '../utils/deploy-helpers'

/**
 * Deploys the EscrowRecoveryFacet and cuts it into the existing TellerDiamond.
 *
 * This is a one-off remediation deploy. Run with:
 *   FORKING_NETWORK=mainnet yarn hardhat deploy --network hardhat --tags escrow-recovery
 *
 * Or on mainnet (requires the diamond-owner key configured as `deployer`):
 *   yarn hardhat deploy --network mainnet --tags escrow-recovery
 *
 * Idempotent: skips the cut if all selectors are already wired to the latest
 * deployment of the facet.
 */
const deployEscrowRecovery: DeployFunction = async (
  hre: HardhatRuntimeEnvironment
) => {
  const { contracts, ethers, getNamedSigner, log } = hre
  const deployerSigner = await getNamedSigner('deployer')

  log('********** EscrowRecoveryFacet **********', { indent: 1 })

  const facet = await deploy({
    hre,
    contract: 'EscrowRecoveryFacet',
    skipIfAlreadyDeployed: false,
  })

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  // Both selectors we want to register.
  const facetAbi = facet.interface
  const adminClearSel = facetAbi.getSighash('adminClearV1NFTs')
  const viewSel = facetAbi.getSighash('getLoanV1NFTs')

  // Read the loupe to see what's already wired.
  const adminClearOwner: string = await diamond.facetAddress(adminClearSel)
  const viewOwner: string = await diamond.facetAddress(viewSel)

  const ZERO = ethers.constants.AddressZero
  const cuts: {
    facetAddress: string
    action: 0 | 1 | 2
    functionSelectors: string[]
  }[] = []

  // Group selectors by their action (Add vs Replace), per the new facet address.
  const addSelectors: string[] = []
  const replaceSelectors: string[] = []

  for (const [sel, owner] of [
    [adminClearSel, adminClearOwner] as const,
    [viewSel, viewOwner] as const,
  ]) {
    if (owner === ZERO) {
      addSelectors.push(sel)
    } else if (owner.toLowerCase() !== facet.address.toLowerCase()) {
      replaceSelectors.push(sel)
    }
  }

  if (addSelectors.length > 0) {
    cuts.push({
      facetAddress: facet.address,
      action: 0, // Add
      functionSelectors: addSelectors,
    })
  }
  if (replaceSelectors.length > 0) {
    cuts.push({
      facetAddress: facet.address,
      action: 1, // Replace
      functionSelectors: replaceSelectors,
    })
  }

  if (cuts.length === 0) {
    log('All selectors already wired to current facet. Nothing to cut.', {
      indent: 2,
      star: true,
    })
    return
  }

  log(`Cutting ${cuts.length} facet group(s) into TellerDiamond...`, {
    indent: 2,
    star: true,
  })

  // IERC173 isn't part of the ITellerDiamond surface, so reach it directly.
  const erc173 = new ethers.Contract(
    diamond.address,
    ['function owner() view returns (address)'],
    ethers.provider
  )
  const owner: string = await erc173.owner()
  const deployerAddr = await deployerSigner.getAddress()
  if (owner.toLowerCase() !== deployerAddr.toLowerCase()) {
    throw new Error(
      `deployer (${deployerAddr}) is not the diamond owner (${owner}); ` +
        `cannot perform diamondCut from this signer`
    )
  }

  const tx = await diamond
    .connect(deployerSigner)
    .diamondCut(cuts, ZERO, '0x')
  const receipt = await tx.wait()
  log(`done (gas: ${receipt.gasUsed.toString()})`, { indent: 2 })
}

deployEscrowRecovery.tags = ['escrow-recovery']
deployEscrowRecovery.dependencies = []

export default deployEscrowRecovery
