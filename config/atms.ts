import { ATM, ATMs, Config, Network } from '../types/custom/config-types'

const teller: ATM = {
  name: 'Teller',
  token: {
    name: 'Teller Token',
    symbol: 'TLR',
    decimals: 18,
    maxCap: 100000000000,
    maxVestingPerWallet: 50
  },
  tlrInitialReward: 0,
  maxDebtRatio: 5000
}

const mainnetATMs: ATMs = {
  teller
}

export const atmsConfigsByNetwork: Config<ATMs> = {
  kovan: {
    teller
  },
  rinkeby: {
    teller
  },
  ropsten: {
    teller
  },
  hardhat: mainnetATMs,
  localhost: mainnetATMs,
  mainnet: mainnetATMs
}

export const getATMs = (network: Network) => atmsConfigsByNetwork[network]
