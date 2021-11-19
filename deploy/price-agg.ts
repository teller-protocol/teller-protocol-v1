import colors from 'colors'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { getChainlink, getNetworkName, getTokens } from '../config'
import { Tokens } from '../types/custom/config-types'
import {
  ChainlinkPricer,
  ENSRegistry,
  IsaLPPricer,
  PriceAggregator,
  PublicResolver,
} from '../types/typechain'
import { DUMMY_ADDRESS } from '../utils/consts'
import { deploy } from '../utils/deploy-helpers'

const registerPriceAggregators: DeployFunction = async (hre) => {
  const { network, log, ethers } = hre

  const tokens = getTokens(network)

  log('********** Chainlink **********', { indent: 1 })
  log('')

  const chainlinkPricer = await deployChainlinkPricer(hre)

  const priceAgg = await deploy<PriceAggregator>({
    contract: 'PriceAggregator',
    args: [tokens.all.WETH],
    skipIfAlreadyDeployed: true,
    hre,

    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      execute: {
        init: {
          methodName: 'initialize',
          args: [chainlinkPricer.address],
        },
      },
    },
  })

  const definedPricer = await priceAgg.chainlinkPricer()
  if (
    ethers.utils.getAddress(definedPricer) !=
    ethers.utils.getAddress(chainlinkPricer.address)
  ) {
    await priceAgg.setChainlinkPricer(chainlinkPricer.address)
  }

  await addCompoundPricer(priceAgg, hre)
  await addAavePricer(priceAgg, hre)

  log('')
}

export const deployChainlinkPricer = async (
  hre: HardhatRuntimeEnvironment
): Promise<ChainlinkPricer> => {
  let resolverAddress: string
  let chainlinkPricer: ChainlinkPricer
  switch (getNetworkName(hre.network)) {
    case 'mainnet':
    case 'rinkeby':
    case 'ropsten':
      resolverAddress = '0x122eb74f9d0F1a5ed587F43D120C1c2BbDb9360B'
      chainlinkPricer = await deploy<ChainlinkPricer>({
        contract: 'ChainlinkPricer',
        args: [resolverAddress],
        skipIfAlreadyDeployed: false,
        hre,
      })
      break

    case 'polygon':
    case 'polygon_mumbai':
      resolverAddress = await deployChainlinkENS(hre)
      chainlinkPricer = await deploy<ChainlinkPricer>({
        contract: 'PolygonChainlinkPricer',
        name: 'ChainlinkPricer',
        args: [resolverAddress],
        skipIfAlreadyDeployed: false,
        hre,
      })
      break
    case 'kovan':
      resolverAddress = await deployChainlinkENS(hre)
      chainlinkPricer = await deploy<ChainlinkPricer>({
        contract: 'ChainlinkPricer',
        args: [resolverAddress],
        skipIfAlreadyDeployed: false,
        hre,
      })
      break

    default:
      throw new Error('Invalid network name')
  }

  return chainlinkPricer
}

export const deployChainlinkENS = async (
  hre: HardhatRuntimeEnvironment
): Promise<string> => {
  const deployer = await hre.getNamedSigner('deployer')
  const deployerAddress = await deployer.getAddress()

  const ensRegistry = await deploy<ENSRegistry>({
    contract: 'ENSRegistry',
    skipIfAlreadyDeployed: true,
    hre,
  })
  const resolver = await deploy<PublicResolver>({
    contract: 'PublicResolver',
    args: [ensRegistry.address, DUMMY_ADDRESS],
    skipIfAlreadyDeployed: true,
    hre,
  })

  const tld = 'eth'
  const tldLabel = hre.ethers.utils.id(tld)
  const tldNode = hre.ethers.utils.namehash(tld)

  const mainDomain = 'data'
  const dataLabel = hre.ethers.utils.id(mainDomain)
  const dataNode = hre.ethers.utils.namehash(`${mainDomain}.${tld}`)

  if (ensRegistry.deployResult.newlyDeployed) {
    await ensRegistry
      .connect(deployer)
      .setSubnodeOwner(Buffer.alloc(32), tldLabel, deployerAddress)
      .then(({ wait }) => wait())
    await ensRegistry
      .connect(deployer)
      .setSubnodeOwner(tldNode, dataLabel, deployerAddress)
      .then(({ wait }) => wait())
    await ensRegistry
      .connect(deployer)
      .setResolver(tldNode, resolver.address)
      .then(({ wait }) => wait())
    await ensRegistry
      .connect(deployer)
      .setResolver(dataNode, resolver.address)
      .then(({ wait }) => wait())
    await resolver
      .connect(deployer)
      ['setAddr(bytes32,address)'](tldNode, resolver.address)
      .then(({ wait }) => wait())
    await resolver
      .connect(deployer)
      ['setAddr(bytes32,address)'](dataNode, resolver.address)
      .then(({ wait }) => wait())
  }

  hre.log('')
  hre.log('Registering Chainlink ENS names', { star: true, indent: 1 })

  const chainlink = getChainlink(hre.network)
  for (const config of Object.values(chainlink)) {
    const chainlinkAggSubdomain = `${config.baseTokenName.toLowerCase()}-${config.quoteTokenName.toLowerCase()}`
    const chainlinkAggDomain = `${chainlinkAggSubdomain}.${mainDomain}.${tld}`
    const chainlinkAggLabel = hre.ethers.utils.id(chainlinkAggSubdomain)
    const chainlinkAggNode = hre.ethers.utils.namehash(chainlinkAggDomain)
    const address = await resolver['addr(bytes32)'](chainlinkAggNode)

    hre.log(`${colors.underline(chainlinkAggSubdomain)}: ${config.address}`, {
      star: true,
      nl: false,
      indent: 2,
    })

    if (address != config.address) {
      await ensRegistry
        .connect(deployer)
        .setSubnodeOwner(dataNode, chainlinkAggLabel, deployerAddress)
        .then(({ wait }) => wait())
      const receipt = await resolver
        .connect(deployer)
        ['setAddr(bytes32,address)'](chainlinkAggNode, config.address)
        .then(({ wait }) => wait())

      const gas = `${receipt.gasUsed.toString()} gas`
      hre.log(` ${colors.green('new')} with ${colors.cyan(gas)}`)
    } else {
      hre.log(` ${colors.yellow('reusing')}`)
    }
  }

  return resolver.address
}

export const addCompoundPricer = async (
  priceAgg: PriceAggregator,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { all: allTokens, compound: tokens } = getTokens(hre.network)

  if (tokens == null) return

  const pricer = await deploy<IsaLPPricer>({
    contract: 'CompoundPricer',
    args: [allTokens.WETH, tokens.CETH],
    skipIfAlreadyDeployed: true,
    hre,
  })

  await addPricer({
    priceAgg,
    pricer,
    tokens,
    hre,
  })
}

const addAavePricer = async (
  priceAgg: PriceAggregator,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { aave: tokens } = getTokens(hre.network)

  const pricer = await deploy<IsaLPPricer>({
    contract: 'AavePricer',
    skipIfAlreadyDeployed: true,
    hre,
  })

  await addPricer({
    priceAgg,
    pricer,
    tokens,
    hre,
  })
}

const addPoolTogetherPricer = async (
  priceAgg: PriceAggregator,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { poolTogether: tokens } = getTokens(hre.network)

  const pricer = await deploy<IsaLPPricer>({
    contract: 'PoolTogetherPricer',
    skipIfAlreadyDeployed: true,
    hre,
  })

  await addPricer({
    priceAgg,
    pricer,
    tokens,
    hre,
  })
}

interface AddPricerArgs {
  priceAgg: PriceAggregator
  pricer: IsaLPPricer
  tokens?: Tokens
  hre: HardhatRuntimeEnvironment
}

const addPricer = async (args: AddPricerArgs): Promise<void> => {
  const { priceAgg, pricer, tokens, hre } = args

  // Check if the tokens map exists
  if (tokens == null) return

  // Loop each token address and check if any need to be set
  const tokensToSet: string[] = []
  for (const tokenAddress of Object.values(tokens)) {
    const pricerAddress = await priceAgg.saLPPricer(tokenAddress)
    if (pricerAddress !== pricer.address) {
      tokensToSet.push(tokenAddress)
    }
  }

  // Set pricer for tokens if needed
  if (tokensToSet.length > 0) {
    await priceAgg
      .connect(await hre.getNamedSigner('deployer'))
      .setAssetPricers(pricer.address, tokensToSet)
      .then(({ wait }) => wait())
  }
}

registerPriceAggregators.tags = ['price-agg']
registerPriceAggregators.dependencies = ['setup']

export default registerPriceAggregators
