import { BigNumber } from 'ethers'

export const MAX_VALUE = BigNumber.from(2).pow(256).mul(1)
export const ONE_DAY = 60 * 60 * 24

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
  Address,
  Amount,
  Bool,
  Uint,
}
