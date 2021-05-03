import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

export const tenderlyPush = async (
  args: null,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { deployments, tenderly } = hre

  const allDeployments = await deployments.all().then((all) =>
    Object.entries(all).map(([name, { address }]) => ({
      name,
      address,
    }))
  )

  await tenderly.push(allDeployments)
}

task('tenderly-push', 'Pushes all deployed contracts to Tenderly').setAction(
  tenderlyPush
)
