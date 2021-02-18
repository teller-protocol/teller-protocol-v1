import { DeployFunction } from 'hardhat-deploy/types'

import { deploy, deployLogic } from '../utils/deploy-helpers'

const deployLogicContracts: DeployFunction = async (hre) => {
  const { address: loanLibAddress } = await deploy({
    hre,
    contract: 'LoanLib',
  })

  await deployLogic({
    hre,
    contract: 'TToken',
  })

  await deployLogic({
    hre,
    contract: 'EtherCollateralLoans',
    libraries: {
      LoanLib: loanLibAddress,
    },
  })

  await deployLogic({
    hre,
    contract: 'TokenCollateralLoans',
    libraries: {
      LoanLib: loanLibAddress,
    },
  })

  await deployLogic({
    hre,
    contract: 'ChainlinkAggregator',
  })

  await deployLogic({
    hre,
    contract: 'LendingPool',
  })

  await deployLogic({
    hre,
    contract: 'LoanTermsConsensus',
  })

  await deployLogic({
    hre,
    contract: 'EscrowFactory',
  })

  await deployLogic({
    hre,
    contract: 'MarketFactory',
  })

  await deployLogic({
    hre,
    contract: 'Uniswap',
  })

  await deployLogic({
    hre,
    contract: 'Compound',
  })

  await deployLogic({
    hre,
    contract: 'Settings',
  })

  await deployLogic({
    hre,
    contract: 'LogicVersionsRegistry',
  })

  await deployLogic({
    hre,
    contract: 'AssetSettings',
  })
}

deployLogicContracts.tags = ['logic']

export default deployLogicContracts
