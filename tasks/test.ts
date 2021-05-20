import { spawn } from 'child_process'
import { subtask, task, types } from 'hardhat/config'
import waitPort from 'wait-port'
import killPort from 'kill-port'
const port = 8545
task('test', async (args, hre, runSuper): Promise<void> => {
  const { run } = hre

  await run('test:fork')
  await killPort(port, 'tcp')
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
      fork.kill('SIGKILL')
    })

    fork.on('close', (code) => {
      log(`fork process exited with code ${code}`, { star: true })
      fork.kill('SIGKILL')
    })

    fork.on('uncaughtException', (err) => {
      fork.kill('SIGKILL')
    })
    fork.on('exit', (code) => {
      fork.kill('SIGKILL')
    })
    fork.on('error', (err) => {
      fork.kill('SIGKILL')
    })
    fork.on('end', (err) => {
      fork.kill('SIGKILL')
    })
    fork.on('close', (err) => {
      fork.kill('SIGKILL')
    })

    log('')
    log(`Forking ${chain}... `, { star: true, nl: false })
    await waitPort({ port: 8545 })
    log('')
  })
