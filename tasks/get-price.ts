import { BigNumberish, FixedNumber } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens } from '../config'
import { PriceAggregator } from '../types/typechain'

interface GetPricesArgs {
  src: string
  dst: string
  amount?: BigNumberish
}

export interface GetPricesReturn {
  value: string
}

export const getPrice = async (
  args: GetPricesArgs,
  hre: HardhatRuntimeEnvironment
): Promise<GetPricesReturn> => {
  const { contracts, network, tokens, ethers, toBN, log } = hre

  let srcStr = args.src.toUpperCase()
  let dstStr = args.dst.toUpperCase()
  if (args.src.toUpperCase() === 'ETH') {
    srcStr = 'WETH'
  }
  if (args.dst.toUpperCase() === 'ETH') {
    dstStr = 'WETH'
  }
  const { [srcStr]: srcAddress, [dstStr]: dstAddress } = getTokens(network).all

  const priceAgg = await contracts.get<PriceAggregator>('PriceAggregator')

  const src = await tokens.get(srcStr)
  const dst = await tokens.get(dstStr)

  const dstFactor = toBN(1, await dst.decimals())

  log(``)
  log(`Price for ${srcStr}/${dstStr}`, { indent: 1 })

  const answer = await priceAgg.getPriceFor(srcAddress, dstAddress)
  const price = FixedNumber.fromValue(answer, 0).divUnsafe(FixedNumber.fromValue(dstFactor, 0))
  let value = price
  if (args.amount) {
    const valueFor = await priceAgg.getValueFor(
      srcAddress,
      dstAddress,
      ethers.parseUnits(
        BigInt(args.amount).toString(),
        await src.decimals()
      )
    )
    value = FixedNumber.fromValue(valueFor, 0).divUnsafe(FixedNumber.fromValue(dstFactor, 0))
  }

  log(`Price   : ${price.toString()}`, { indent: 2, star: true })
  log(`Value   : ${value.toString()}`, { indent: 2, star: true })
  log(``)

  return {
    value: value.toString(),
  }
}

task('get-price', 'Gets the value for a given token in terms of another')
  .addParam('src', 'The source token symbol')
  .addParam('dst', 'The destination token symbol')
  .addOptionalParam(
    'amount',
    'The amount to get the value for',
    undefined,
    types.float
  )
  .setAction(getPrice)
