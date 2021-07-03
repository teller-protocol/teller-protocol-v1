import { Network } from 'hardhat/types'
import path from 'path'

import { Tokens } from '../types/custom/config-types'
import { assetSettings } from './asset-settings'
import { atms } from './atms'
import { chainlink } from './chainlink'
import { markets } from './markets'
import { nftMerkleTree, tiers as nftTiers } from './nft'
import { nodes } from './nodes'
import { platformSettings } from './platform-settings'
import { signers } from './signers'
import { tokens } from './tokens'
import { dapps } from './dapps'

export const getNetworkName = (network: Network): string =>
  process.env.FORKING_NETWORK ?? network.name

export const getAssetSettings = (network: Network) =>
  assetSettings[getNetworkName(network)]

export const getATMs = (network: Network) => atms[getNetworkName(network)]

export const getChainlink = (network: Network) =>
  chainlink[getNetworkName(network)]

export const getMarkets = (network: Network) => markets[getNetworkName(network)]

export const getNodes = (network: Network) => nodes[getNetworkName(network)]

export const getPlatformSettings = (network: Network) =>
  platformSettings[getNetworkName(network)]

export const getSigners = (network: Network) => signers[network.name]

export const getTokens = (network: Network) => {
  const networkTokens = tokens[getNetworkName(network)]
  const all: Tokens = Object.keys(networkTokens).reduce((map, type) => {
    // @ts-expect-error keys
    map = { ...map, ...networkTokens[type] }
    return map
  }, {})
  return {
    ...networkTokens,
    all,
  }
}

export const getNativeToken = (network: Network) => {
  const tokens = getTokens(network)
  let wrappedNativeToken
  if (
    network.name === 'mainnet' ||
    network.name === 'kovan' ||
    network.name === 'rinkeby' ||
    network.name === 'ropsten'
  ) {
    wrappedNativeToken = tokens.erc20.WETH
  } else {
    wrappedNativeToken = tokens.erc20.WMATIC
  }
  return wrappedNativeToken
}

export const getDappAddresses = (network: Network) =>
  dapps[getNetworkName(network)]

export const getNFT = (network: Network) => {
  const distributionsOutputFile = path.resolve(
    path.join(
      __dirname,
      '../deployments',
      network.name,
      '.nftDistribution.json'
    )
  )

  return {
    tiers: nftTiers,
    merkleTrees: nftMerkleTree[getNetworkName(network)],
    distributionsOutputFile,
  }
}
