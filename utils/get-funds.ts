import hre from 'hardhat'

import { IUniswapV2Router02 } from '../types/typechain'
import { getTokens } from '../config/tokens'
import { Address, Network, TokenSymbol } from '../types/custom/config-types'
import { BigNumberish, Signer } from 'ethers'

export interface SwapArgs {
  to: Address | Signer
  tokenSym: TokenSymbol
  amount: BigNumberish
}

export const getFunds = async (args: SwapArgs): Promise<void> => {
  const { getNamedSigner, ethers, contracts } = hre

  // Uniswap - https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance
  const swapper = await contracts.get<IUniswapV2Router02>('IUniswapV2Router02', {
    at: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D'
  })

  // Tokens
  const tokens = getTokens(<Network>hre.network.name)

  // ETH balance
  const funder = await getNamedSigner('funder')
  const deployerETHBalance = await ethers.provider.getBalance(funder.getAddress())
  const ethToSend = deployerETHBalance.mul('9').div('10')

  const toAddress = Signer.isSigner(args.to)
    ? await args.to.getAddress()
    : args.to

  // Swap ETH for given token
  await swapper.swapETHForExactTokens(
    args.amount,
    [tokens.WETH, tokens[args.tokenSym]],
    toAddress,
    Date.now() + 10000,
    { value: ethToSend }
  )
}
