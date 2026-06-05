import { HardhatRuntimeEnvironment } from 'hardhat/types'

import {
  MainnetTellerNFT,
  TellerNFT,
  TellerNFTDictionary,
} from '../../types/typechain'

interface MintNFTV1Args {
  tierIndex: number
  borrower: string
  hre: HardhatRuntimeEnvironment
}

export const mintNFTV1 = async (args: MintNFTV1Args): Promise<void> => {
  const { tierIndex, borrower, hre } = args

  const deployer = await hre.getNamedSigner('deployer')
  const nft: TellerNFT = await hre.contracts.get('TellerNFT')
  const dictionary: TellerNFTDictionary = await hre.contracts.get(
    'TellerNFTDictionary'
  )

  const receipt = await nft.connect(deployer).mint(tierIndex, borrower)
  const [event] = await nft.queryFilter(
    nft.filters.Transfer(null, borrower, null),
    receipt.blockHash
  )
  const tokenIDV1 = event.args.tokenId
  await dictionary
    .connect(deployer)
    .setTokenTierForTokenId(tokenIDV1, tierIndex)
}

interface MintNFTV2Args extends MintNFTV1Args {
  amount: number
}

export const mintNFTV2 = async (args: MintNFTV2Args): Promise<void> => {
  const { tierIndex, amount, borrower, hre } = args

  const deployer = await hre.getNamedSigner('deployer')
  const nft: MainnetTellerNFT = await hre.contracts.get('TellerNFT_V2')

  await nft.connect(deployer).mint(borrower, tierIndex, amount)
}

export type V2BalanceArray = [bigint[], bigint[]]
export interface V2BalanceObj {
  ids: bigint[]
  balances: bigint[]
}
export type V2Balances = V2BalanceArray & V2BalanceObj

export const mergeV2IDsToBalances = (v2IDs: bigint[]): V2Balances => {
  const v2Balances: { [v2ID: number]: bigint } = {}
  for (const v2IDBN of v2IDs) {
    const v2ID = Number(v2IDBN)
    if (v2Balances[v2ID] == null) v2Balances[v2ID] = 0n
    v2Balances[v2ID] = v2Balances[v2ID] + 1n
  }

  const ids: bigint[] = []
  const balances: bigint[] = []
  const response: V2Balances = Object.assign<V2BalanceArray, V2BalanceObj>(
    [ids, balances],
    {
      ids,
      balances,
    }
  )
  for (const [v2ID, v2Balance] of Object.entries(v2Balances)) {
    ids.push(BigInt(v2ID))
    balances.push(v2Balance)
  }
  return response
}
