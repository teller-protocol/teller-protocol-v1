import { extendEnvironment } from 'hardhat/config'
import { Contract, Signer } from 'ethers'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    contracts: ContractsExtension
    getNamedSigner(name: string): Promise<Signer>
  }
}

interface ContractsExtension {
  get<C extends Contract>(name: string, config?: Config): Promise<C>
}

interface Config {
  from?: string | Signer
  at?: string
}

extendEnvironment((hre) => {
  const { deployments, ethers, getNamedAccounts } = hre
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
    }
  }
  hre.getNamedSigner = async (name: string): Promise<Signer> => {
    const accounts = await getNamedAccounts()
    return ethers.provider.getSigner(accounts[name])
  }
})
