import { BigNumber, BigNumberish, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens } from '../../config'
import { Address, TokenSymbol } from '../../types/custom/config-types'
import { ERC20, IUniswapV2Router } from '../../types/typechain'
import {
  UNISWAP_ROUTER_V2_ADDRESS,
  SUSHISWAP_ROUTER_V2_ADDRESS_POLYGON,
} from '../../utils/consts'

export interface SwapArgs {
  to: Address | Signer
  tokenSym: TokenSymbol
  amount: BigNumberish
  hre: HardhatRuntimeEnvironment
}

export const getFunds = async (args: SwapArgs): Promise<void> => {
  const { getNamedSigner, ethers, contracts } = args.hre

  const funder = await getNamedSigner('funder')

  let routerAddress = UNISWAP_ROUTER_V2_ADDRESS
  // If the forked network is polygon (or something other than L1 eth)
  // Use the Sushiswap router Polygon address instead of Mainnet Uniswap
  if (
    (await args.hre.config.networks.hardhat.forking?.url)?.match(/eth/) == null
  ) {
    routerAddress = SUSHISWAP_ROUTER_V2_ADDRESS_POLYGON
  }

  // Uniswap - https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance
  const swapper = await contracts.get<IUniswapV2Router>('IUniswapV2Router', {
    at: routerAddress,
    from: funder,
  })

  // Tokens
  const { all: tokenAddresses } = getTokens(args.hre.network)

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

export interface FundLenderArgs {
  token: ERC20
  amount: BigNumberish
  hre: HardhatRuntimeEnvironment
}

export const fundLender = async (args: FundLenderArgs): Promise<BigNumber> => {
  const amount = args.hre.toBN(args.amount, await args.token.decimals())
  // Get lender DAI to deposit
  await getFunds({
    to: await args.hre.getNamedSigner('lender'),
    tokenSym: await args.token.symbol(),
    amount,
    hre: args.hre,
  })
  return amount
}
