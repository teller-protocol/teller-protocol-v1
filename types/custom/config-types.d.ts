import { BigNumberish } from 'ethers'

import { AssetType } from '../../utils/consts'

type Address = string
type TokenSymbol = string
type URI = string

export interface AssetSettings {
  [tokenSymbol: string]: AssetSetting[]
}

export interface AssetSetting<V = any> {
  key: string
  value: V
  type: AssetType
}

// export interface AssetSetting {
//   cToken: TokenSymbol
//   aToken?: TokenSymbol
//   yVault?: TokenSymbol
//   pPool?: TokenSymbol
//   maxLoanAmount: number
//   maxTVLAmount: number
//   maxDebtRatio: number
// }

export interface ATMs {
  [atmName: string]: ATM
}

interface ATM {
  name: string
  token: ATMToken
  tlrInitialReward: number
  maxDebtRatio: number
}

interface ATMToken {
  name: string
  symbol: TokenSymbol
  decimals: number
  maxCap: number
  maxVestingPerWallet: number
}

interface Market {
  lendingToken: TokenSymbol
  collateralTokens: TokenSymbol[]
  strategy: MarketStrategy
}
interface MarketStrategy {
  name: string
  initArgs: Array<{
    type: 'TokenSymbol' | 'Address' | 'Number' | 'ProtocolAddressConstant'
    value: any
  }>
}

export interface Chainlink {
  [pairSymbols: string]: ChainlinkPair
}

export interface ChainlinkPair {
  baseTokenName: TokenSymbol
  quoteTokenName: TokenSymbol
  address: Address
}

export interface Compound {
  [tokenSymbol: string]: string
}

export interface Uniswap {
  v2Router: Address
}

export interface PlatformSettings {
  NFTInterestRate: PlatformSetting
  RequiredSubmissionsPercentage: PlatformSetting
  MaximumTolerance: PlatformSetting
  ResponseExpiryLength: PlatformSetting
  TermsExpiryTime: PlatformSetting
  LiquidateRewardPercent: PlatformSetting
  MaximumLoanDuration: PlatformSetting
  CollateralBuffer: PlatformSetting
  OverCollateralizedBuffer: PlatformSetting
  RequestLoanTermsRateLimit: PlatformSetting
}

export interface PlatformSetting {
  processOnDeployment: boolean
  value: number | string
  min: number | string
  max: number | string
}

export interface Signers extends Array<Address> {}

export interface NetworkTokens {
  erc20: Tokens
  compound?: Tokens
  aave?: Tokens
  poolTogether?: Tokens
  yearn?: Tokens
}

export interface Tokens {
  [tokenSymbol: string]: Address
}

export interface Nodes {
  [name: string]: URI
}

export interface TierInfo {
  baseLoanSize: BigNumberish
  hashes: string[]
  contributionAsset: string
  contributionSize: BigNumberish
  contributionMultiplier: string | number
}

export type NFTMerkleTree = Array<{
  tierIndex: number
  balances: Array<{
    address: string
    count: BigNumberish
  }>
}>
