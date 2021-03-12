import { makeNodeDisklet } from 'disklet'
import path from 'path'
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
  }
}

interface ContractsExtension {
  get<C extends Contract>(name: string, config?: Config): Promise<C>
}

interface TokensExtension {
  get<T extends ERC20Detailed>(name: string): Promise<T>
}

interface EVM {
  advanceTime(seconds: BigNumberish): Promise<void>
  advanceBlocks(blocks?: number): Promise<void>
  snapshot(): Promise<() => Promise<void>>
  withBlockScope<T>(blocks: number, fn: () => T): Promise<T>
  impersonate(address: string): Promise<() => Promise<void>>
  stopImpersonating(address: string): Promise<void>
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

    async impersonate(address: string): Promise<() => Promise<void>> {
      await network.provider.send('hardhat_impersonateAccount', [address])
      return () => this.stopImpersonating(address)
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
    } else if (/_Logic$/.test(name)) {
      const [_, contractName] = name.match(/(.+)_Logic$/)!
      data.logics[contractName] = deployment.address
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
