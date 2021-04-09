import { DeployFunction } from 'hardhat-deploy/types'

import { deployDiamond } from '../utils/deploy-diamond'
import { ITellerDiamond } from '../types/typechain'

const deployProtocol: DeployFunction = async (hre) => {
  const {} = hre

  // Deploy platform diamond
  const diamond = await deployDiamond<ITellerDiamond>({
    hre,
    name: 'TellerDiamond',
    facets: [
      'SettingsFacet',
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
      args: [],
    },
  })
}

deployProtocol.tags = ['protocol']

export default deployProtocol
