import { DeployFunction } from 'hardhat-deploy/types'

import {
  deploy,
  DeployLogicArgs,
  deployLogic,
  deploySettingsProxy,
} from '../utils/deploy-helpers'
import { getTokens } from '../config/tokens'
import { Network } from '../types/custom/config-types'
import { MarketFactory, Settings } from '../types/typechain'
import { getUniswap } from '../config/uniswap'

const deployLogicContracts: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts, ethers, network } = hre
  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(<Network>network.name)
  const uniswap = getUniswap(<Network>network.name)

  const mock = network.name.includes('hardhat')
  const logicDeploymentData: Omit<DeployLogicArgs, 'hre'>[] = [
    {
      contract: 'Settings',
    },
    {
      contract: 'AssetSettings',
    },
    {
      contract: 'MarketRegistry',
    },
    {
      contract: 'PriceAggregator',
    },
    {
      contract: 'TToken',
    },
    {
      contract: 'LoanData',
    },
    {
      contract: 'LoanTermsConsensus',
    },
    {
      contract: 'LoanManager',
      mock,
    },
    {
      contract: 'LendingPool',
    },
    {
      contract: 'Uniswap',
    },
    {
      contract: 'DappRegistry',
    },
    {
      contract: 'MarketFactory',
    },
    {
      contract: 'Escrow',
    },
    {
      contract: 'UniswapDapp',
    },
    {
      contract: 'CompoundDapp',
    },
    {
      contract: 'AaveDapp',
    },
    {
      contract: 'YearnDapp',
    },
    {
      contract: 'PoolTogetherDapp',
    },
  ]

  const initialLogicVersions: { logic: string; logicName: string }[] = []
  for (const logicData of logicDeploymentData) {
    const { address: logic } = await deployLogic(
      {
        hre,
        ...logicData,
      },
      '0'
    )
    initialLogicVersions.push({
      logic,
      logicName: ethers.utils.id(logicData.contract),
    })
  }

  const { address: initDynamicProxyLogicAddress } = await deployLogic({
    hre,
    contract: 'InitializeableDynamicProxy',
  })

  await deploySettingsProxy({
    hre,
    initialLogicVersions,
  })

  const settings = await contracts.get<Settings>('Settings', { from: deployer })
  await settings['initialize(address,address,address,address)'](
    tokens.WETH,
    tokens.CETH,
    initDynamicProxyLogicAddress,
    uniswap.v2Router
  )

  await deployments.save('LogicVersionsRegistry', {
    ...(await deployments.getExtendedArtifact('LogicVersionsRegistry')),
    address: await settings.logicRegistry(),
  })

  await deployments.save('PriceAggregator', {
    ...(await deployments.getExtendedArtifact('PriceAggregator')),
    address: await settings.priceAggregator(),
  })

  await deployments.save('AssetSettings', {
    ...(await deployments.getExtendedArtifact('AssetSettings')),
    address: await settings.assetSettings(),
  })

  await deployments.save('DappRegistry', {
    ...(await deployments.getExtendedArtifact('DappRegistry')),
    address: await settings.dappRegistry(),
  })

  await deployments.save('MarketFactory', {
    ...(await deployments.getExtendedArtifact('MarketFactory')),
    address: await settings.marketFactory(),
  })
  const marketFactory = await contracts.get<MarketFactory>('MarketFactory')

  await deployments.save('MarketRegistry', {
    ...(await deployments.getExtendedArtifact('MarketRegistry')),
    address: await marketFactory.marketRegistry(),
  })
}

deployLogicContracts.tags = ['settings']

export default deployLogicContracts
