import { Chainlink, Config, Network } from '../types/custom/config-types'

const mainnetChainlink: Chainlink = {
  USDC_ETH: {
    baseTokenName: 'USDC',
    quoteTokenName: 'ETH',
    address: '0x986b5E1e1755e3C2440e960477f25201B0a8bbD4'
  },
  USDT_ETH: {
    baseTokenName: 'USDT',
    quoteTokenName: 'ETH',
    address: '0xEe9F2375b4bdF6387aa8265dD4FB8F16512A1d46'
  },
  DAI_ETH: {
    baseTokenName: 'DAI',
    quoteTokenName: 'ETH',
    address: '0x773616E4d11A78F511299002da57A0a94577F1f4'
  },
  WBTC_ETH: {
    // NOTE: 'Chainlink aggregator for BTC/ETH not WBTC/ETH',
    baseTokenName: 'WBTC',
    quoteTokenName: 'ETH',
    address: '0xdeb288F737066589598e9214E782fa5A8eD689e8'
  },
  SNX_ETH: {
    baseTokenName: 'SNX',
    quoteTokenName: 'ETH',
    address: '0x79291A9d692Df95334B1a0B3B4AE6bC606782f8c'
  },
  MKR_ETH: {
    baseTokenName: 'MKR',
    quoteTokenName: 'ETH',
    address: '0x24551a8Fb2A7211A25a17B1481f043A8a8adC7f2'
  },
  YFI_ETH: {
    baseTokenName: 'YFI',
    quoteTokenName: 'ETH',
    address: '0x7c5d4F8345e66f68099581Db340cd65B078C41f4'
  },
  LEND_ETH: {
    baseTokenName: 'LEND',
    quoteTokenName: 'ETH',
    address: '0xc9dDB0E869d931D031B24723132730Ecf3B4F74d'
  },
  LINK_ETH: {
    baseTokenName: 'LINK',
    quoteTokenName: 'ETH',
    address: '0xFf2c64f454EAf1b9ee8c204404A73E287A567A44'
  },
  LINK_DAI: {
    baseTokenName: 'LINK',
    quoteTokenName: 'DAI',
    address: '0x8cf81F00a4249563111d615cb59C935f8e1C6Cce'
  },
  LINK_USDC: {
    baseTokenName: 'LINK',
    quoteTokenName: 'USDC',
    address: '0x6c3FCC05b84A8e9E12Da2bC66f4cf218A9CE3486'
  }
}

const chainlinkConfigsByNetwork: Config<Chainlink> = {
  kovan: {
    ETH_USDC: {
      baseTokenName: 'ETH',
      quoteTokenName: 'USDC',
      address: '0x9326BFA02ADD2366b30bacB125260Af641031331'
    },
    ETH_DAI: {
      baseTokenName: 'ETH',
      quoteTokenName: 'DAI',
      address: '0x9326BFA02ADD2366b30bacB125260Af641031331'
    },
    LINK_DAI: {
      baseTokenName: 'LINK',
      quoteTokenName: 'DAI',
      address: '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0'
    },
    LINK_USDC: {
      baseTokenName: 'LINK',
      quoteTokenName: 'USDC',
      address: '0x396c5E36DD0a0F5a5D33dae44368D4193f69a1F0'
    }
  },
  rinkeby: {
    ETH_USDC: {
      baseTokenName: 'ETH',
      quoteTokenName: 'USDC',
      address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'
    },
    ETH_DAI: {
      baseTokenName: 'ETH',
      quoteTokenName: 'DAI',
      address: '0x8A753747A1Fa494EC906cE90E9f37563A8AF630e'
    },
    LINK_DAI: {
      baseTokenName: 'LINK',
      quoteTokenName: 'DAI',
      address: '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623'
    },
    LINK_USDC: {
      baseTokenName: 'LINK',
      quoteTokenName: 'USDC',
      address: '0xd8bD0a1cB028a31AA859A21A3758685a95dE4623'
    }
  },
  ropsten: {
    USDC_ETH: {
      baseTokenName: 'USDC',
      quoteTokenName: 'ETH',
      address: '0xE48d431DB6cdf5E361c554fA95826a44A27d1167'
    },
    DAI_ETH: {
      baseTokenName: 'DAI',
      quoteTokenName: 'ETH',
      address: '0xd63bAd023755e15c7B4ce99dB8B71100A0736d43'
    },
    LINK_DAI: {
      baseTokenName: 'LINK',
      quoteTokenName: 'DAI',
      address: '0x5029aeAdB0b1371EfCfC7b2b1C824756bDF12D28'
    },
    LINK_USDC: {
      baseTokenName: 'LINK',
      quoteTokenName: 'USDC',
      address: '0xD4d78d8e18d4717F5eE8801335eE5b5B97a4b824'
    }
  },
  hardhat: mainnetChainlink,
  localhost: mainnetChainlink,
  mainnet: mainnetChainlink
}

export const getChainlink = (network: Network) => chainlinkConfigsByNetwork[network]
