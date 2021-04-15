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
  RequiredSubmissionsPercentage: PlatformSetting
  MaximumTolerance: PlatformSetting
  ResponseExpiryLength: PlatformSetting
  SafetyInterval: PlatformSetting
  TermsExpiryTime: PlatformSetting
  LiquidateEthPrice: PlatformSetting
  MaximumLoanDuration: PlatformSetting
  CollateralBuffer: PlatformSetting
  OverCollateralizedBuffer: PlatformSetting
  StartingBlockOffsetNumber: PlatformSetting
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
  compound: Tokens
}

export interface Tokens {
  [tokenSymbol: string]: Address
}

export interface Nodes {
  [name: string]: URI
}

export interface TierInfo {
  baseLoanSize: string
  hashes: string[]
  contributionAsset: string
  contributionSize: string
  contributionMultiplier: string
}

export type NFTMerkleTree = Array<{
  tierIndex: number
  balances: Array<{
    address: string
    count: BigNumberish
  }>
}>
