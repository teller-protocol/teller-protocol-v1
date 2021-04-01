export type Network =
  | 'rinkeby'
  | 'kovan'
  | 'ropsten'
  | 'hardhat'
  | 'localhost'
  | 'mainnet'

export type Config<T> = {
  [N in Network]: T
}

type Address = string
type TokenSymbol = string
type URI = string

export interface AssetSettings {
  [tokenSymbol: string]: AssetSetting
}

export interface AssetSetting {
  cToken: TokenSymbol
  aToken?: TokenSymbol
  yVault?: TokenSymbol
  pPool?: TokenSymbol
  maxLoanAmount: number
  maxTVLAmount: number
  maxDebtRatio: number
}

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
  borrowedToken: TokenSymbol
  collateralToken: TokenSymbol
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

export interface Tokens {
  [tokenSymbol: string]: Address
}

export interface Nodes {
  [name: string]: URI
}
