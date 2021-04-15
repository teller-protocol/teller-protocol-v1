import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens, getUniswap } from '../config'
import { ITellerDiamond } from '../types/typechain'
import { deployDiamond } from '../utils/deploy-helpers'

const deployProtocol: DeployFunction = async (hre) => {
  const { network, getNamedAccounts } = hre

  const { deployer } = await getNamedAccounts()

  const tokens = getTokens(network)
  const initArgs: Parameters<ITellerDiamond['init']>[0] = {
    admin: deployer,
    assets: Object.entries(tokens.erc20).map(([sym, addr]) => ({ sym, addr })),
    cTokens: Object.values(tokens.compound),
    uniswapV2Router: getUniswap(network).v2Router,
  }

  // Deploy platform diamond
  const diamond = await deployDiamond<ITellerDiamond, 'init'>({
    hre,
    name: 'TellerDiamond',
    facets: [
      'SettingsFacet',
      'PlatformSettingsFacet',
      'AssetSettingsFacet',
      'PriceAggFacet',
      'ChainlinkAggFacet',
      // 'LendingFacet',
      // 'CreateLoanFacet',
      // 'LoanDataFacet',
      // 'CollateralFacet',
      // 'RepayFacet',
      // 'LiquidateFacet',
      // 'SignersFacet',
      // 'StakingFacet',
      // 'EscrowFacet',
    ],
    owner: deployer,
    execute: {
      methodName: 'init',
      args: [initArgs],
    },
  })

  await addAuthorizedAddresses(hre, diamond)
}

const addAuthorizedAddresses = async (
  hre: HardhatRuntimeEnvironment,
  diamond: ITellerDiamond
): Promise<void> => {
  const { getNamedAccounts, network } = hre

  const addresses: string[] = []
  if (network.name === 'mainnet') {
  } else {
    const accounts = await getNamedAccounts()
    addresses.push(accounts.lender, accounts.borrower)
  }

  await diamond.addAuthorizedAddressList(addresses)
}

deployProtocol.tags = ['protocol']

export default deployProtocol
