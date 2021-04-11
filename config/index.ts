import { Network } from 'hardhat/types'

import { assetSettings } from './asset-settings'
import { atms } from './atms'
import { chainlink } from './chainlink'
import { markets } from './markets'
import { nftMerkleTree, tiers as nftTiers } from './nft'
import { nodes } from './nodes'
import { platformSettings } from './platform-settings'
import { signers } from './signers'
import { tokens } from './tokens'
import { uniswap } from './uniswap'

const getNetworkName = (network: Network): string =>
  network.config.forkName ?? network.name

export const getAssetSettings = (network: Network) =>
  assetSettings[getNetworkName(network)]

export const getATMs = (network: Network) => atms[getNetworkName(network)]

export const getChainlink = (network: Network) =>
  chainlink[getNetworkName(network)]

export const getMarkets = (network: Network) => markets[getNetworkName(network)]

export const getNodes = (network: Network) => nodes[getNetworkName(network)]

export const getPlatformSettings = (network: Network) =>
  platformSettings[getNetworkName(network)]

export const getSigners = (network: Network) => signers[getNetworkName(network)]

export const getTokens = (network: Network) => tokens[getNetworkName(network)]

export const getUniswap = (network: Network) => uniswap[getNetworkName(network)]

export const getNFT = (network: Network) => ({
  tiers: nftTiers,
  merkleTrees: nftMerkleTree[getNetworkName(network)],
  distributionsOutputFile: `deployments/${network.name}/_nftDistribution.json`,
})
