import { Config, Network, Nodes } from '../types/custom/config-types'

export const nodesConfigsByNetwork: Config<Nodes> = {
  kovan: {

  },
  rinkeby: {
    saxle: 'https://node-saxle.layr1.com',
    tpscript: 'https://node-tpscrpt.layr1.com'
  },
  ropsten: {
    sypeer: 'https://node-sypeer.layr1.com'
  },
  hardhat: {

  },
  mainnet: {

  }
};

export const getNodes = (network: Network) => nodesConfigsByNetwork[network];
