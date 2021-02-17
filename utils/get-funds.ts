import hre from 'hardhat'

import { IUniswapV2Router02 } from '../types/typechain'
import { getTokens } from '../config/tokens'
import { Network, TokenSymbol } from '../types/custom/config-types'

export interface SwapArgs {
  tokenSym: TokenSymbol
  amount: number
}

export const getFunds = async (args: SwapArgs): Promise<void> => {
  const { getNamedSigner, ethers, contracts } = hre

  const deployer = await getNamedSigner('deployer')
  const deployerAddress = await deployer.getAddress()

  // Uniswap - https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance
  const uniswapRouterAddress = '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
  const swapper = await contracts.get<IUniswapV2Router02>('IUniswapV2Router02', { at: uniswapRouterAddress, from: deployer })

  // Tokens
  const tokens = getTokens(<Network>hre.network.name)

  // ETH balance
  const deployerETHBalance = await ethers.provider.getBalance(deployerAddress)

  // Swap ETH for given token
  await swapper.swapETHForExactTokens(args.amount, [tokens.WETH, tokens[args.tokenSym]], deployerAddress, Date.now() + 10000, {
    value: deployerETHBalance.mul('9').div('10'),
  })
}
