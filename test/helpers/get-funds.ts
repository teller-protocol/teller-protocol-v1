import { BigNumber, BigNumberish, Signer } from 'ethers'
import hre from 'hardhat'

import { getTokens } from '../../config'
import { Address, TokenSymbol } from '../../types/custom/config-types'
import { ERC20, IUniswapV2Router } from '../../types/typechain'
import { UNISWAP_ROUTER_V2_ADDRESS } from '../../utils/consts'

export interface SwapArgs {
  to: Address | Signer
  tokenSym: TokenSymbol
  amount: BigNumberish
}

export const getFunds = async (args: SwapArgs): Promise<void> => {
  const { getNamedSigner, ethers, tokens, contracts } = hre

  const funder = await getNamedSigner('funder')

  // Uniswap - https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance
  const swapper = await contracts.get<IUniswapV2Router>('IUniswapV2Router', {
    at: UNISWAP_ROUTER_V2_ADDRESS,
    from: funder,
  })

  // Tokens
  const { all: tokenAddresses } = getTokens(hre.network)

  const toAddress = Signer.isSigner(args.to)
    ? await args.to.getAddress()
    : args.to

  if (args.tokenSym === 'ETH') {
    await funder.sendTransaction({
      to: toAddress,
      value: args.amount,
    })
  } else {
    // ETH balance
    const deployerETHBalance = await ethers.provider.getBalance(
      funder.getAddress()
    )
    const ethToSend = deployerETHBalance.mul('1').div('10')

    // Swap ETH for given token
    await swapper.swapETHForExactTokens(
      args.amount,
      [tokenAddresses.WETH, tokenAddresses[args.tokenSym]],
      toAddress,
      Date.now() + 10000,
      { value: ethToSend }
    )
  }
}

export const fundLender = async (
  token: ERC20,
  amount: BigNumberish
): Promise<BigNumber> => {
  amount = hre.toBN(amount, await token.decimals())
  // Get lender DAI to deposit
  await getFunds({
    to: await hre.getNamedSigner('lender'),
    tokenSym: await token.symbol(),
    amount,
  })
  return amount
}
