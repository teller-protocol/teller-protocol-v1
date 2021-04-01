import hre from 'hardhat'
import { BigNumberish, Signer } from 'ethers'

import { IUniswapV2Router02 } from '../../types/typechain'
import { Address, TokenSymbol } from '../../types/custom/config-types'
import { getTokens } from '../../config'

export interface SwapArgs {
  to: Address | Signer
  tokenSym: TokenSymbol
  amount: BigNumberish
}

export const getFunds = async (args: SwapArgs): Promise<void> => {
  const { getNamedSigner, ethers, contracts } = hre

  const funder = await getNamedSigner('funder')

  // Uniswap - https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance
  const swapper = await contracts.get<IUniswapV2Router02>(
    'IUniswapV2Router02',
    {
      at: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
      from: funder,
    }
  )

  // Tokens
  const tokens = getTokens(hre.network)

  // ETH balance
  const deployerETHBalance = await ethers.provider.getBalance(
    funder.getAddress()
  )
  const ethToSend = deployerETHBalance.mul('5').div('10')

  const toAddress = Signer.isSigner(args.to)
    ? await args.to.getAddress()
    : args.to

  if (args.tokenSym === 'ETH') {
    await funder.sendTransaction({
      to: toAddress,
      value: args.amount,
    })
  } else {
    // Swap ETH for given token
    await swapper.swapETHForExactTokens(
      args.amount,
      [tokens.WETH, tokens[args.tokenSym]],
      toAddress,
      Date.now() + 10000,
      { value: ethToSend }
    )
  }
}
