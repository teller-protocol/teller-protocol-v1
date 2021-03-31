import { ethers } from 'hardhat'
import { makeNodeDisklet } from 'disklet'
import { extendEnvironment } from 'hardhat/config'
import {
  DeploymentSubmission,
  DeployOptions,
  DeployResult,
} from 'hardhat-deploy/types'
import { BigNumber, BigNumberish, Contract, Signer } from 'ethers'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'

import { ERC20Detailed } from '../types/typechain'
import { getTokens } from '../config/tokens'
import { Address, Network } from '../types/custom/config-types'

declare module 'hardhat/types/runtime' {
  interface HardhatRuntimeEnvironment {
    contracts: ContractsExtension
    tokens: TokensExtension
    evm: EVM
    getNamedSigner(name: string): Promise<Signer>
    fastForward(seconds: BigNumberish): Promise<void>
    toBN(amount: BigNumberish, decimals?: BigNumberish): BigNumber
    fromBN(amount: BigNumberish, decimals?: BigNumberish): BigNumber
    log(message: string): void
  }
}

interface ContractsExtension {
  get<C extends Contract>(name: string, config?: Config): Promise<C>
}

interface TokensExtension {
  get<T extends ERC20Detailed>(name: string): Promise<T>
}

interface EVM {
  /**
   * This increases the next block's timestamp by the specified amount of seconds.
   * @param seconds {BigNumberish} Amount of seconds to increase the next block's timestamp by.
   */
  advanceTime(seconds: BigNumberish): Promise<void>

  /**
   * Will mine the specified number of blocks locally. This is helpful when functionality
   * requires a certain number of blocks to be processed for values to change.
   * @param blocks {number} Amount of blocks to mine.
   */
  advanceBlocks(blocks?: number): Promise<void>

  /**
   * Creates a snapshot of the blockchain in its current state. It then returns a function
   * that can be used to revert back to the state at which the snapshot was taken.
   */
  snapshot(): Promise<() => Promise<void>>

  /**
   * This allows for functionality to executed within the scope of the specified number
   * of additional blocks to be mined. Once the supplied function to be called within
   * the scope is executed, the blockchain is reverted back to the state it started at.
   * @param blocks {number} The number of blocks that should be mined.
   * @param fn {function} A function that should be executed once blocks have been mined.
   */
  withBlockScope<T>(blocks: number, fn: () => T): Promise<T>

  /**
   * Impersonates a supplied address. This allows for the execution of transactions
   * with the `from` field to be the supplied address. This allows for the context
   * of `msg.sender` in a transaction to also be the supplied address.
   *
   * Once you have completed the action of impersonating an address, you may wish to
   * stop impersonating it. To do this, a `stop` function is also returned for
   * convenience. This may also be achieved by calling `evm.stopImpersonating`.
   *
   * To do this:
   *  1. Impersonate an address.
   *  2. Execute a transaction on a contract by connecting the returned signer.
   *    Ex:
   *      const impersonation = await evm.impersonate(0x123)
   *      await contract.connect(impersonation.signer).functionToCall()
   * @param address {string} An address to start impersonating.
   * @return {Promise<ImpersonateReturn>}
   */
  impersonate(address: string): Promise<ImpersonateReturn>

  /**
   * It stops the ability to impersonate an address on the local blockchain.
   * @param address {string} An address to stop impersonating.
   */
  stopImpersonating(address: string): Promise<void>
}

interface ImpersonateReturn {
  signer: Signer
  stop: () => Promise<void>
}

interface Config {
  from?: string | Signer
  at?: string
}

interface AddressData {
  lendingPools: AddressObj
  markets: AddressObj
  libraries: AddressObj
  proxies: AddressObj
  logics: AddressObj
}
interface AddressObj {
  [name: string]: Address
}

extendEnvironment((hre) => {
  const { deployments, ethers, getNamedAccounts, network } = hre

  const disklet = makeNodeDisklet('.')

  hre.contracts = {
    async get<C extends Contract>(name: string, config?: Config): Promise<C> {
      const { address } = config?.at
        ? { address: config.at }
        : await deployments.get(name)
      let contract = await ethers.getContractAt(name, address)

      if (config) {
        if (config.from) {
          const signer = Signer.isSigner(config.from)
            ? config.from
            : ethers.provider.getSigner(config.from)
          contract = contract.connect(signer)
        }
      }

      return contract as C
    },
  }

  hre.tokens = {
    async get<T extends ERC20Detailed>(name: string): Promise<T> {
      const tokens = getTokens(<Network>network.name)
      const token = await ethers.getContractAt('ERC20Detailed', tokens[name])
      return token as T
    },
  }

  hre.getNamedSigner = async (name: string): Promise<Signer> => {
    const accounts = await getNamedAccounts()
    return ethers.provider.getSigner(accounts[name])
  }

  hre.fastForward = async (seconds: BigNumberish) => {
    seconds = hre.toBN(seconds).toNumber()
    await network.provider.send('evm_increaseTime', [seconds])
    await network.provider.send('evm_mine')
  }

  hre.evm = {
    async advanceTime(seconds: BigNumberish): Promise<void> {
      await hre.fastForward(seconds)
    },

    async advanceBlocks(blocks = 1): Promise<void> {
      for (let block = 0; block < blocks; block++) {
        // 15 seconds per block
        await this.advanceTime(15)
      }
    },

    async snapshot(): Promise<() => Promise<void>> {
      const id = await network.provider.send('evm_snapshot')
      return async () => {
        await network.provider.send('evm_revert', [id])
      }
    },

    async withBlockScope(blocks: number, fn: () => any): Promise<any> {
      const revert = await this.snapshot()
      await this.advanceBlocks(blocks)
      const result = await fn()
      await revert()
      return result
    },

    async impersonate(address: string): Promise<ImpersonateReturn> {
      await network.provider.send('hardhat_impersonateAccount', [address])
      return {
        signer: ethers.provider.getSigner(address),
        stop: () => this.stopImpersonating(address),
      }
    },

    async stopImpersonating(address: string): Promise<void> {
      await network.provider.send('hardhat_stopImpersonatingAccount', [address])
    },
  }

  hre.toBN = (amount: BigNumberish, decimals?: BigNumberish): BigNumber => {
    const num = BigNumber.from(amount)
    if (decimals) {
      return num.mul(BigNumber.from('10').pow(decimals))
    }
    return num
  }

  hre.fromBN = (amount: BigNumberish, decimals?: BigNumberish): BigNumber => {
    const num = BigNumber.from(amount)
    if (decimals) {
      return num.div(BigNumber.from('10').pow(decimals))
    }
    return num
  }

  const originalDeploymentsSave = hre.deployments.save
  hre.deployments.save = async (
    name: string,
    deployment: DeploymentSubmission
  ): Promise<void> => {
    // Don't save deployment files for specific name (i.e. market and lending pool contracts)
    const marketsRegex = /^Market_/
    const lpRegex = /^LP_/
    if (![marketsRegex, lpRegex].some((regex) => regex.test(name))) {
      await originalDeploymentsSave(name, deployment)
    }

    // Don't save addresses on the hardhat network
    if (hre.network.name === 'hardhat') return

    const filePath = `deployments/${hre.network.name}/_addresses.json`
    let data: AddressData
    try {
      data = JSON.parse(await disklet.getText(filePath))
    } catch {
      data = {
        lendingPools: {},
        markets: {},
        libraries: {},
        proxies: {},
        logics: {},
      }
    }

    if (marketsRegex.test(name)) {
      const [_, market] = name.match(/^Market_(.+_.+)/)!
      data.markets![market] = deployment.address
    } else if (lpRegex.test(name)) {
      const [_, sym] = name.match(/^LP_(.+)/)!
      data.lendingPools![sym] = deployment.address
    } else if (/_Logic_v(.+)/.test(name)) {
      const [_, contractName, version] = name.match(/(.+)_Logic_v(.+)$/)!
      data.logics[`${contractName}_v${version}`] = deployment.address
    } else if (/Lib$/.test(name)) {
      data.libraries[name] = deployment.address
    } else {
      data.proxies[name] = deployment.address
    }

    const sortedData: AddressData = sortObject(data)

    await disklet.setText(filePath, JSON.stringify(sortedData, null, 2))
  }

  const originalDeploymentsDeploy = hre.deployments.deploy
  hre.deployments.deploy = async (
    name: string,
    options: DeployOptions
  ): Promise<DeployResult> => {
    const result = await originalDeploymentsDeploy(name, options)
    await hre.deployments.save(name, result)
    return result
  }
})

const sortObject = (obj: any): any => {
  const tmp: any = {}
  const keys = Object.keys(obj).sort()
  for (const key of keys) {
    tmp[key] = typeof obj[key] === 'object' ? sortObject(obj[key]) : obj[key]
  }
  return tmp
}
