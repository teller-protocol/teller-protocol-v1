import { extendEnvironment } from 'hardhat/config'
import { Contract } from 'ethers'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-deploy'

declare module "hardhat/types/runtime" {
  interface HardhatRuntimeEnvironment {
    contracts: ContractsExtension
  }
}

interface ContractsExtension {
  get<C extends Contract>(name: string, config?: Config): Promise<C>
}

interface Config {
  from?: string
}

extendEnvironment((hre) => {
  const { deployments, ethers } = hre
  hre.contracts = {
    async get<C extends Contract>(name: string, config?: Config): Promise<C> {
      const { address } = await deployments.get(name)
      let contract = await ethers.getContractAt(name, address)

      if (config) {
        if (config.from) {
          contract = contract.attach(config.from)
        }
      }

      return contract as C
    }
  }
})
