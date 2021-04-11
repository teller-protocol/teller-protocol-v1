import { DeployFunction } from 'hardhat-deploy/types'

import { deployDiamond } from '../utils/deploy-diamond'
import { ITellerDiamond } from '../types/typechain'
import { getTokens, getUniswap } from '../config'

const deployProtocol: DeployFunction = async (hre) => {
  const { network } = hre

  const tokens = getTokens(network)
  const initArgs = {
    assets: Object.entries(tokens),
    uniswapV2Router: getUniswap(network).v2Router,
  }

  // Deploy platform diamond
  const diamond = await deployDiamond<ITellerDiamond>({
    hre,
    name: 'TellerDiamond',
    facets: [
      'SettingsFacet',
      'PlatformSettingsFacet',
      'LendingFacet',
      'CreateLoanFacet',
      'LoanDataFacet',
      'CollateralFacet',
      'RepayFacet',
      'LiquidateFacet',
      'SignersFacet',
      'StakingFacet',
      'EscrowFacet',
    ],
    execute: {
      methodName: 'init',
      args: [initArgs],
    },
  })
}

deployProtocol.tags = ['protocol']

export default deployProtocol
