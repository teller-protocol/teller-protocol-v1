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
    Object.entries(all).map(([name, { artifactName, address }]) => ({
      name: artifactName ?? name,
      customName: name,
      address,
    }))
  )

  // await to make sure contracts are verified and pushed
  await Promise.all(
    allDeployments.map(async (deployment) => {
      await Promise.all([
        tenderly.verify(deployment),
        tenderly.push(deployment),
      ])
    })
  )
}

task(
  'tenderly-contracts',
  'Verifies and pushes all deployed contracts to Tenderly'
).setAction(tenderlyContracts)
