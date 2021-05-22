import * as fs from 'fs-extra'
import { TASK_TEST_RUN_MOCHA_TESTS } from 'hardhat/builtin-tasks/task-names'
import { subtask, task, types } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'
import * as path from 'path'

import { getFunds } from '../test/helpers/get-funds'

interface NetworkArgs {
  chain: string
  block?: number
  silent?: boolean
  onlyDeployment?: boolean
}

export const forkNetwork: ActionType<NetworkArgs> = async (
  args: NetworkArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { chain, block, ...remaining } = args
  const { config, log, run } = hre

  if (/localhost|hardhat/.test(chain))
    throw new Error('Cannot fork the Hardhat or localhost network')
  const availableNetworks = Object.keys(config.networks)
  if (!availableNetworks.includes(chain)) {
    throw new Error(`network must be one of ${availableNetworks.join(', ')}`)
  }

  log('')
  log(`Forking ${chain}... `, { star: true })
  log('')

  const networkName = 'hardhat'
  const deploymentsDir = path.resolve(process.cwd(), 'deployments')
  const srcDir = path.resolve(deploymentsDir, chain)
  const dstDir = path.resolve(deploymentsDir, networkName)
  await fs.emptyDirSync(dstDir)
  await fs.ensureDir(srcDir)
  await fs.copy(srcDir, dstDir, {
    overwrite: true,
    recursive: true,
    preserveTimestamps: true,
  })
  await fs.writeFile(`${dstDir}/.chainId`, '31337')
  await fs.writeFile(`${dstDir}/.forkingNetwork`, `${chain}`)

  if (block) process.env.FORKING_BLOCK = String(block)
  process.env.FORKING_NETWORK = String(chain)

  if (!args.onlyDeployment) {
    await run('node', {
      ...remaining,
      noDeploy: true,
      noReset: true,
      write: false,
    })
    await run('fork:fund-deployer')
  }
}

task('fork', 'Forks a chain and starts a JSON-RPC server of that forked chain')
  .addOptionalPositionalParam(
    'chain',
    'An ETH network name to fork',
    'mainnet',
    types.string
  )
  .addOptionalParam('silent', 'Silent logs', false, types.boolean)
  .addOptionalParam(
    'block',
    'Fork network at a particular block number',
    undefined,
    types.int
  )
  .addOptionalPositionalParam(
    'onlyDeployment',
    'optional flag that just copies the deployment files',
    true,
    types.boolean
  )
  .setAction(forkNetwork)

subtask('fork:fund-deployer').setAction(async (args, hre) => {
  const { ethers } = hre

  const [mainAccount] = await hre.getUnnamedAccounts()
  const { deployer } = await hre.getNamedAccounts()
  if (
    ethers.utils.getAddress(mainAccount) !== ethers.utils.getAddress(deployer)
  ) {
    await getFunds({
      to: deployer,
      tokenSym: 'ETH',
      amount: hre.ethers.utils.parseEther('1000'),
      hre,
    })
  }
})
