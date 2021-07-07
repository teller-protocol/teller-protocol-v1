import { Nodes } from '../types/custom/config-types'

export const nodes: Record<string, Nodes> = {
  kovan: {},
  rinkeby: {
    saxle: 'https://node-saxle.layr1.com',
    tpscript: 'https://node-tpscrpt.layr1.com',
  },
  ropsten: {
    sypeer: 'https://node-sypeer.layr1.com',
  },
  hardhat: {},
  localhost: {},
  mainnet: {},
  polygon: {},
  polygon_mumbai: {},
}
