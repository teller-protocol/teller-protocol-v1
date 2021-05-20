import { spawn } from 'child_process'
import { subtask, task, types } from 'hardhat/config'
import waitPort from 'wait-port'

task('test', async (args, hre, runSuper): Promise<void> => {
  const { run } = hre

  await run('test:fork')
  await runSuper({})
})

interface TestForkArgs {
  chain: string
}

subtask<TestForkArgs>('test:fork')
  .addParam('chain', 'An ETH network name to fork', 'mainnet', types.string)
  .setAction(async (args, hre) => {
    const { chain } = args
    const { log } = hre

    const fork = spawn(`yarn`, ['hh', 'fork', chain], {
      cwd: process.cwd(),
    })

    fork.stderr.on('data', (data) => {
      log(`fork error: ${data}`, { star: true })
    })

    fork.on('close', (code) => {
      log(`fork process exited with code ${code}`, { star: true })
    })

    process.on('uncaughtException', (err) => {
      console.error(err)
      fork.kill(1)
    })
    process.on('exit', (code) => {
      fork.kill(code)
    })

    log('')
    log(`Forking ${chain}... `, { star: true, nl: false })
    await waitPort({ port: 8545 })
    log('')
  })
