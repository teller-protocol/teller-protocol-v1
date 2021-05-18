import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ITellerDiamond } from '../../types/typechain'
import * as fs from 'fs-extra'
import * as path from 'path'

interface NetworkArgs {
  chain: string
  block?: number
}

export async function forkNetwork(
  args: NetworkArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> {
  const { log, run } = hre
  if (!['mainnet', 'rinkeby', 'kovan', 'ropsten'].includes(args.chain)) {
    throw new Error(
      `chain must be one of 'mainnet', 'rinkeby', 'kovan', 'ropsten' `
    )
  }
  console.log(`Forking ${args.chain}...`)
  const deploymentsDir = path.resolve(__dirname, '../../deployments')
  await fs.emptyDirSync(deploymentsDir + '/localhost')
  await fs.copy(
    `${deploymentsDir}/${args.chain}`,
    `${deploymentsDir}/localhost`
  )
  await fs.writeFile(`${deploymentsDir}/localhost/.chainId`, '31337')
  await fs.writeFile(
    `${deploymentsDir}/localhost/.forkingNetwork`,
    `${args.chain}`
  )
  if (args.block) process.env.FORKING_BLOCK = String(args.block)
  process.env.FORKING_NETWORK = String(args.chain)
  await run('node', { noDeploy: true })
}

task('fork', 'Forks a chain and starts a JSON-RPC server of that forked chain')
  .addParam('chain', 'An ETH chain to fork', undefined, types.string)
  .addOptionalParam(
    'block',
    'forch chain at a particular block number',
    undefined,
    types.int
  )
  .setAction(forkNetwork)
