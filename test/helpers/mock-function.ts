import { Contract, ethers, Signer } from 'ethers'
import { contracts, getNamedSigner } from 'hardhat'
import { IDiamondCut, ITellerDiamond } from '../../types/typechain'

export const mockFunctions = async (
  diamondCut: Parameters<
    IDiamondCut['functions']['diamondCut(tuple[],address,bytes)']
  >,
  target?: Contract,
  from?: Signer
) => {
  target ??= await contracts.get<ITellerDiamond>('TellerDiamond', { from })
  from ??= await getNamedSigner('deployer')
  await target.diamondCut(diamondCut)
  return target
}
