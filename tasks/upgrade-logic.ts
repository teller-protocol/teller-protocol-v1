import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { LogicVersionsRegistry } from '../types/typechain'

export interface UpgradeLogicArgs {
  contract: string
  useFixture?: boolean
  log?: boolean
}

export async function upgradeLogic(
  { contract, log = true, useFixture = false }: UpgradeLogicArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { ethers, deployments, contracts, getNamedSigner } = hre
  const deployer = await getNamedSigner('deployer')
  const logicName = ethers.utils.id(contract)
  const versionRegistry = await contracts.get<LogicVersionsRegistry>(
    'LogicVersionsRegistry'
  )
  const {
    latestVersion,
    currentVersion,
    logic,
  } = await versionRegistry.getLogicVersion(logicName)

  if (log)
    console.log(`Upgrading ${contract} --
Latest version: ${latestVersion}
Current version: ${currentVersion} at ${logic}`)

  const { address, newlyDeployed } = await deployments.deploy(
    `${contract}_Logic_v${latestVersion.add(1).toString()}`,
    {
      contract: useFixture ? contract + 'Fixture' : contract,
      from: await deployer.getAddress(),
    }
  )

  if (!newlyDeployed)
    return log
      ? console.error(`${contract} hasn't changed, aborting`)
      : undefined

  if (log) console.log(`Deployed new ${contract} at ${address}`)

  await versionRegistry.connect(deployer).updateLogicAddress(logicName, address)

  if (log) console.log(`Updated logic version registry`)
}

task('upgrade-logic', 'Upgrades the logic version for a contract')
  .addParam('contract', 'Canonical contract name')
  .setAction(upgradeLogic)
