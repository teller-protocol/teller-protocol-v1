import { ATM, ATMs } from '../types/custom/config-types'

const teller: ATM = {
  name: 'Teller',
  token: {
    name: 'Teller Token',
    symbol: 'TLR',
    decimals: 18,
    maxCap: 100000000000,
    maxVestingPerWallet: 50,
  },
  tlrInitialReward: 0,
  maxDebtRatio: 5000,
}

const mainnetATMs: ATMs = {
  teller,
}

export const atms: Record<string, ATMs> = {
  kovan: {
    teller,
  },
  rinkeby: {
    teller,
  },
  ropsten: {
    teller,
  },
  hardhat: mainnetATMs,
  localhost: mainnetATMs,
  mainnet: mainnetATMs,
}
