import { ChainlinkPair, Config, Network } from '../types/custom/config-types'

const mainnetChainlink: ChainlinkPair[] = [
  {
    baseTokenSym: 'USDC',
    quoteTokenSym: 'ETH',
    address: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4',
  },
  {
    baseTokenSym: 'USDT',
    quoteTokenSym: 'ETH',
    address: '0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46',
  },
  {
    baseTokenSym: 'DAI',
    quoteTokenSym: 'ETH',
    address: '0x773616E4d11A78F511299002da57A0a94577F1f4',
  },
  {
    // NOTE: 'Chainlink aggregator for BTC/ETH not WBTC/ETH',
    baseTokenSym: 'WBTC',
    quoteTokenSym: 'ETH',
    address: '0xdeb288F737066589598e9214E782fa5A8eD689e8',
  },
  {
    baseTokenSym: 'SNX',
    quoteTokenSym: 'ETH',
    address: '0x79291A9d692Df95334B1a0B3B4AE6bC606782f8c',
  },
  {
    baseTokenSym: 'MKR',
    quoteTokenSym: 'ETH',
    address: '0x24551a8Fb2A7211A25a17B1481f043A8a8adC7f2',
  },
  {
    baseTokenSym: 'YFI',
    quoteTokenSym: 'ETH',
    address: '0x7c5d4F8345e66f68099581Db340cd65B078C41f4',
  },
  {
    baseTokenSym: 'LEND',
    quoteTokenSym: 'ETH',
    address: '0xc9dDB0E869d931D031B24723132730Ecf3B4F74d',
  },
  {
    baseTokenSym: 'LINK',
    quoteTokenSym: 'ETH',
    address: '0xDC530D9457755926550b59e8ECcdaE7624181557',
  },
]

const chainlinkConfigsByNetwork: Config<ChainlinkPair[]> = {
  kovan: [
    {
      baseTokenSym: 'ETH',
      quoteTokenSym: 'USDC',
      address: '0x9326BFA02ADD2366b30bacB125260Af641031331',
    },
    {
      baseTokenSym: 'ETH',
      quoteTokenSym: 'DAI',
      address: '0x9326BFA02ADD2366b30bacB125260Af641031331',
    },
    {
      baseTokenSym: 'LINK',
      quoteTokenSym: 'DAI',
      address: '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0',
    },
    {
      baseTokenSym: 'LINK',
      quoteTokenSym: 'USDC',
      address: '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0',
    },
  ],
  rinkeby: [
    {
      baseTokenSym: 'ETH',
      quoteTokenSym: 'USDC',
      address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    {
      baseTokenSym: 'ETH',
      quoteTokenSym: 'DAI',
      address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e',
    },
    {
      baseTokenSym: 'LINK',
      quoteTokenSym: 'DAI',
      address: '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623',
    },
    {
      baseTokenSym: 'LINK',
      quoteTokenSym: 'USDC',
      address: '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623',
    },
  ],
  ropsten: [
    {
      baseTokenSym: 'USDC',
      quoteTokenSym: 'ETH',
      address: '0xE48d431DB6cdf5E361c554fA95826a44A27d1167',
    },
    {
      baseTokenSym: 'DAI',
      quoteTokenSym: 'ETH',
      address: '0xd63bAd023755e15c7B4ce99dB8B71100A0736d43',
    },
    {
      baseTokenSym: 'LINK',
      quoteTokenSym: 'DAI',
      address: '0x5029aeAdB0b1371EfCfC7b2b1C824756bDF12D28',
    },
    {
      baseTokenSym: 'LINK',
      quoteTokenSym: 'USDC',
      address: '0xD4d78d8e18d4717F5eE8801335eE5b5B97a4b824',
    },
  ],
  hardhat: mainnetChainlink,
  localhost: mainnetChainlink,
  mainnet: mainnetChainlink,
}

export const getChainlink = (network: Network) => chainlinkConfigsByNetwork[network]
