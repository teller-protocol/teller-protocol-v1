import * as fs from 'fs-extra'
import { task, types } from 'hardhat/config'
import { ActionType, HardhatRuntimeEnvironment } from 'hardhat/types'
import * as path from 'path'

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

  log(`Forking ${chain}... `, { star: true })
  log('')

  const networkName = 'hardhat'
  const deploymentsDir = path.resolve(process.cwd(), 'deployments')
  const dstDir = path.resolve(process.cwd(), 'deployments', networkName)
  await fs.emptyDirSync(dstDir)
  await fs.copy(`${deploymentsDir}/${chain}`, dstDir)
  await fs.writeFile(`${dstDir}/.chainId`, '31337')
  await fs.writeFile(`${dstDir}/.forkingNetwork`, `${chain}`)

  if (block) process.env.FORKING_BLOCK = String(block)
  process.env.FORKING_NETWORK = String(chain)

  if (!args.onlyDeployment) {
    console.log('we shall deploy...')
    await run('node', {
      ...remaining,
      noDeploy: true,
      noReset: true,
      write: false,
    })
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
