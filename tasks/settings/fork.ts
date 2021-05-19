import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { ITellerDiamond } from '../../types/typechain'
import * as fs from 'fs-extra'
import * as path from 'path'

interface NetworkArgs {
  chain: string
  block?: number
  silent?: boolean
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
  console.log({ args })
  const { chain, block, ...remaining } = args
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
  await run('node', {
    ...remaining,
    noDeploy: true,
    noReset: true,
    write: false,
  })
  await hre.evm.impersonate('0xafe87013dc96ede1e116a288d80fcaa0effe5fe5')
}

task('fork', 'Forks a chain and starts a JSON-RPC server of that forked chain')
  .addParam('chain', 'An ETH chain to fork', 'mainnet', types.string)
  .addOptionalParam('silent', 'silent or not', false, types.boolean)
  .addOptionalParam(
    'block',
    'forch chain at a particular block number',
    undefined,
    types.int
  )
  .setAction(forkNetwork)
