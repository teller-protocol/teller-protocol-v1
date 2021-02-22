import { extendEnvironment } from 'hardhat/config'
import { BigNumber, Contract, Signer } from 'ethers'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'
import { ERC20Detailed } from '../types/typechain'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'

declare module 'hardhat/types/runtime' {
  interface HardhatRuntimeEnvironment {
    contracts: ContractsExtension
    tokens: TokensExtension
    getNamedSigner(name: string): Promise<Signer>
    fastForward(seconds: number): Promise<void>
    BN(amount: string, decimals: string): string
    bytes(name: string): string
  }
}

interface ContractsExtension {
  get<C extends Contract>(name: string, config?: Config): Promise<C>
}

interface TokensExtension {
  get<T extends ERC20Detailed>(name: string): Promise<T>
}

interface Config {
  from?: string | Signer
  at?: string
}

extendEnvironment((hre) => {
  const { deployments, ethers, getNamedAccounts, network } = hre
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

  hre.fastForward = async (seconds: number) => {
    await network.provider.send('evm_increaseTime', [seconds])
    await network.provider.send('evm_mine')
  }

  hre.BN = (amount: string, decimals: string): string => {
    return BigNumber.from(amount)
      .mul(BigNumber.from('10').pow(decimals))
      .toString()
  }

  hre.bytes = (name: string): string => {
    return ethers.utils.keccak256(ethers.utils.toUtf8Bytes(name))
  }
})
