import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { DynamicUpgradeable, LogicVersionsRegistry } from '../types/typechain'
import { deployLogic } from '../utils/deploy-helpers'
import { NULL_ADDRESS } from '../utils/consts'

export interface UpgradeLogicArgs {
  contract: string
}

export async function upgradeLogic(
  args: UpgradeLogicArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { contract: contractName } = args
  const { ethers, contracts, getNamedSigner, run } = hre

  await run('compile')

  const deployer = await getNamedSigner('deployer')
  const logicName = ethers.utils.id(contractName)

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

  process.stdout.write(` * Upgrading ${contractName} \n`)
  process.stdout.write(`   * Latest version: ${latestVersion} \n`)
  process.stdout.write(
    `   * Current version: ${currentVersion} at ${currentLogicAddress} \n`
  )

  const newVersion = latestVersion.add(1)
  const { address: newLogicAddress } = await deployLogic(
    {
      hre,
      contract: contractName,
    },
    newVersion
  )

  // Try to get the proxy address if there is one
  let proxyAddress = NULL_ADDRESS
  await contracts
    .get<DynamicUpgradeable>(contractName)
    .then(async (contract) => {
      const isStrict = await contract.strictDynamic()
      if (!isStrict) {
        proxyAddress = contract.address
      }
    })
    .catch(() => {})

  if (newLogicAddress === currentLogicAddress) {
    console.error(`${contractName} hasn't changed, aborting`)
  } else {
    await versionRegistry.upgradeLogicVersion(
      logicName,
      newLogicAddress,
      proxyAddress
    )

    process.stdout.write(
      `   * New version: ${newVersion.toString()} at ${newLogicAddress} \n`
    )
  }
}

task('upgrade-logic', 'Upgrades the logic version for a contract')
  .addParam('contract', 'Canonical contract name')
  .setAction(upgradeLogic)
