import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { LogicVersionsRegistry } from '../types/typechain'
import { deployLogic } from '../utils/deploy-helpers'
import { NULL_ADDRESS } from '../utils/consts'

export interface UpgradeLogicArgs {
  contract: string
}

export async function upgradeLogic(
  { contract }: UpgradeLogicArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { ethers, contracts, getNamedSigner } = hre

  const deployer = await getNamedSigner('deployer')
  const logicName = ethers.utils.id(contract)

  const versionRegistry = await contracts.get<LogicVersionsRegistry>(
    'LogicVersionsRegistry',
    {
      from: deployer,
    }
  )
  const {
    latestVersion,
    currentVersion,
    logic: currentLogicAddress,
  } = await versionRegistry.getLogicVersion(logicName)

  process.stdout.write(` * Upgrading ${contract} \n`)
  process.stdout.write(`   * Latest version: ${latestVersion} \n`)
  process.stdout.write(
    `   * Current version: ${currentVersion} at ${currentLogicAddress} \n`
  )

  const newVersion = latestVersion.add(1)
  const { address: newLogicAddress } = await deployLogic(
    {
      hre,
      contract,
    },
    newVersion
  )

  if (newLogicAddress === currentLogicAddress) {
    console.error(`${contract} hasn't changed, aborting`)
  } else {
    await versionRegistry.upgradeLogicVersion(
      logicName,
      newLogicAddress,
      NULL_ADDRESS
    )

    process.stdout.write(
      `   * New version: ${newVersion.toString()} at ${newLogicAddress} \n`
    )
  }
}

task('upgrade-logic', 'Upgrades the logic version for a contract')
  .addParam('contract', 'Canonical contract name')
  .setAction(upgradeLogic)
