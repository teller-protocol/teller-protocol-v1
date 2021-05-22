import fs from 'fs-extra'
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

const deploymentsDir = path.join(__dirname, '../deployments')

const getNetworkName = (network: Network): string =>
  /localhost|hardhat/.test(network.name)
    ? fs.readFileSync(
        path.join(deploymentsDir, network.name, '.forkingNetwork'),
        'utf-8'
      )
    : network.name

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
