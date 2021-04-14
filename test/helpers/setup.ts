import { Signer } from 'ethers'
import hre from 'hardhat'

import { ITellerDiamond } from '../../types/typechain'

const { deployments, contracts, getNamedSigner } = hre

export interface TestSetupReturn {
  diamond: ITellerDiamond
  deployer: Signer
}

export const setup = async (): Promise<TestSetupReturn> => {
  await deployments.fixture('protocol')

  const diamond = await getTellerDiamond()
  const deployer = await getNamedSigner('deployer')

  return {
    diamond,
    deployer,
  }
}

const getTellerDiamond = async (): Promise<ITellerDiamond> => {
  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
  if (!diamond) throw new Error(`Teller Diamond not yet deployed`)
  return diamond
}
