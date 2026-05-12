export const MAX_VALUE = 2n ** 256n
export const ONE_DAY = 60 * 60 * 24

export const HUNDRED_PERCENT = 10000

export const UNISWAP_ROUTER_V2_ADDRESS =
  '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
export const SUSHISWAP_ROUTER_V2_ADDRESS_POLYGON =
  '0x1b02dA8Cb0d097eB8D57A175b88c7D8b47997506'
export const DUMMY_ADDRESS = '0x0000000000000000000000000000000000000001'
export const NULL_ADDRESS = '0x0000000000000000000000000000000000000000'

export enum LoanStatus {
  NonExistent,
  TermsSet,
  Active,
  Closed,
  Liquidated,
}

export enum CacheType {
  Address,
  Uint,
  Int,
  Bytes,
  Bool,
}

export enum AssetType {
  Token,
  Address,
  Amount,
  Bool,
  Uint,
}
