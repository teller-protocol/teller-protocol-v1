import { BigNumber, BigNumberish, Signer } from 'ethers'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens, isEtheremNetwork } from '../../config'
import { Address, TokenSymbol } from '../../types/custom/config-types'
import { ERC20, IUniswapV2Router, IWETH } from '../../types/typechain'
import {
  SUSHISWAP_ROUTER_V2_ADDRESS_POLYGON,
  UNISWAP_ROUTER_V2_ADDRESS,
} from '../../utils/consts'

export interface SwapArgs {
  to: Address | Signer
  tokenSym: TokenSymbol
  amount: BigNumberish
  hre: HardhatRuntimeEnvironment
}

export const getFunds = async (args: SwapArgs): Promise<void> => {
  const { getNamedSigner, ethers, contracts, network } = args.hre

  const funder = await getNamedSigner('funder')

  // Tokens
  const { all: tokenAddresses } = getTokens(args.hre.network)

  let routerAddress: string
  const path: string[] = []
  // If the forked network is polygon (or something other than L1 eth)
  // Use the Sushiswap router Polygon address instead of Mainnet Uniswap
  switch (process.env.FORKING_NETWORK) {
    case 'mainnet':
    case 'kovan':
    case 'rinkeby':
    case 'ropsten':
      routerAddress = UNISWAP_ROUTER_V2_ADDRESS
      path.push(tokenAddresses.WETH)
      break
    case 'polygon':
    case 'polygon_mumbai':
      routerAddress = SUSHISWAP_ROUTER_V2_ADDRESS_POLYGON
      path.push(tokenAddresses.WMATIC)
      if (args.tokenSym !== 'WETH') {
        path.push(tokenAddresses.WETH)
      }
      break
    default:
      throw new Error(
        `Forking network is invalid: ${process.env.FORKING_NETWORK}`
      )
  }

  // Uniswap - https://uniswap.org/docs/v2/smart-contracts/router02/ the Router V2 instance
  const swapper = await contracts.get<IUniswapV2Router>('IUniswapV2Router', {
    at: routerAddress,
    from: funder,
  })

  const toAddress = Signer.isSigner(args.to)
    ? await args.to.getAddress()
    : args.to

  if (args.tokenSym === 'ETH' || args.tokenSym === 'MATIC') {
    await funder.sendTransaction({
      to: toAddress,
      value: args.amount,
    })
  } else if (args.tokenSym === 'WETH' && isEtheremNetwork(network)) {
    await sendWrappedNativeToken({
      tokenAddress: tokenAddresses.WETH,
      amount: args.amount,
      hre: args.hre,
      toAddress,
    })
  } else if (args.tokenSym === 'WMATIC' && !isEtheremNetwork(network)) {
    await sendWrappedNativeToken({
      tokenAddress: tokenAddresses.WMATIC,
      amount: args.amount,
      hre: args.hre,
      toAddress,
    })
  } else {
    // ETH/MATIC balance
    const deployerBalance = await ethers.provider.getBalance(
      funder.getAddress()
    )
    const balanceToSend = deployerBalance.mul('1').div('10')
    // Swap ETH/WMATIC for given token
    await swapper.swapETHForExactTokens(
      args.amount,
      [...path, tokenAddresses[args.tokenSym]],
      toAddress,
      Date.now() + 10000,
      { value: balanceToSend }
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

export interface SendNativeTokenArgs {
  tokenAddress: string
  amount: BigNumberish
  toAddress: string
  hre: HardhatRuntimeEnvironment
}

const sendWrappedNativeToken = async (
  args: SendNativeTokenArgs
): Promise<BigNumber> => {
  const funder = await args.hre.getNamedSigner('funder')
  const weth = await args.hre.contracts.get<IWETH>('IWETH', {
    at: args.tokenAddress,
    from: funder,
  })
  const balanceToSend = args.hre.ethers.BigNumber.from(args.amount).mul(2)
  await weth.deposit({ value: balanceToSend, from: funder.getAddress() })
  await weth.transfer(args.toAddress, args.amount, {
    from: funder.getAddress(),
  })
  return await weth.balanceOf(args.toAddress)
}
