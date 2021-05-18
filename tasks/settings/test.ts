import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import * as fs from 'fs-extra'
import * as path from 'path'

interface DeployArgs {
  deploy?: boolean
}

export async function Test(
  args: DeployArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { log, run } = hre
  console.log(`Running tests...`)
  const deploymentsDir = path.resolve(__dirname, '../../deployments')
  const network = await fs.readFile(
    `${deploymentsDir}/localhost/.forkingNetwork`
  )
  process.env.FORKING_NETWORK = network.toString()
  await run('test', { noDeploy: true, write: false })
}

task('test', 'Run all tests on hardhat ')
  .addFlag('deploy', 'Use existing deployments or not')
  .setAction(Test)
