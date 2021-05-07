import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const tenderlyContracts = async (
  args: null,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { deployments, tenderly, network } = hre

  // Only continue on a live network
  if (!network.live)
    throw new Error('Must be on a live network to submit to Tenderly')

  const allDeployments = await deployments.all().then((all) =>
    // const contracts:  = []
    Object.entries(all).map(([name, { artifactName, address }]) => ({
      name: artifactName ?? name,
      customName: name,
      address,
    }))
  )

  await tenderly.verify(...allDeployments)
  await tenderly.push(...allDeployments)
}

task(
  'tenderly-contracts',
  'Verifies and pushes all deployed contracts to Tenderly'
).setAction(tenderlyContracts)
