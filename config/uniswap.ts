import { Config, Network, Uniswap } from '../types/custom/config-types'

const mainnetUniswap: Uniswap = {
  v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
}

export const uniswapConfigsByNetwork: Config<Uniswap> = {
  kovan: {
    v2Router: '',
  },
  rinkeby: {
    v2Router: '',
  },
  ropsten: {
    v2Router: '',
  },
  hardhat: mainnetUniswap,
  localhost: mainnetUniswap,
  mainnet: mainnetUniswap,
}

export const getUniswap = (network: Network) => uniswapConfigsByNetwork[network]
