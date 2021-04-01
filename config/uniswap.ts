import { Uniswap } from '../types/custom/config-types'

const mainnetUniswap: Uniswap = {
  v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
}

export const uniswap: Record<string, Uniswap> = {
  kovan: {
    v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  },
  rinkeby: {
    v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  },
  ropsten: {
    v2Router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
  },
  hardhat: mainnetUniswap,
  localhost: mainnetUniswap,
  mainnet: mainnetUniswap,
}
