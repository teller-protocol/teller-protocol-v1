import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

interface TransferOwnershipArgs {
  newowner: string
}

const transferDiamondOwnership = async (
  args: TransferOwnershipArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { ethers, deployments, getNamedAccounts, log } = hre
  const { deployer } = await getNamedAccounts()

  const diamond = await ethers.getContractAt(
    'IERC173',
    (await deployments.get('TellerDiamond')).address,
    await ethers.provider.getSigner(deployer)
  )

  const currentOwner = await diamond.owner()
  log('')
  log(`Current diamond owner: ${currentOwner}`, { indent: 1, star: true })
  log(`New owner:             ${args.newowner}`, { indent: 1, star: true })

  if (currentOwner.toLowerCase() !== deployer.toLowerCase()) {
    throw new Error(
      `Deployer (${deployer}) is not the current owner. Cannot transfer.`
    )
  }

  const tx = await diamond.transferOwnership(args.newowner)
  const receipt = await tx.wait()

  log(`Ownership transferred! tx: ${receipt?.hash}`, {
    indent: 1,
    star: true,
  })
}

task(
  'transfer-diamond-ownership',
  'Transfer TellerDiamond ownership to a new address'
)
  .addParam('newowner', 'The new owner address', undefined, types.string)
  .setAction(transferDiamondOwnership)
