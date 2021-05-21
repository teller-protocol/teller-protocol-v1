import { BigNumberish } from 'ethers'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getTokens } from '../config'
import { ITellerDiamond } from '../types/typechain'

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
  const { BigNumber: BN, FixedNumber: FN } = ethers

  let srcStr = args.src.toUpperCase()
  let dstStr = args.dst.toUpperCase()
  if (args.src.toUpperCase() === 'ETH') {
    srcStr = 'WETH'
  }
  if (args.dst.toUpperCase() === 'ETH') {
    dstStr = 'WETH'
  }
  const { [srcStr]: srcAddress, [dstStr]: dstAddress } = getTokens(network).all

  const diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

  const src = await tokens.get(srcStr)
  const dst = await tokens.get(dstStr)

  const dstFactor = toBN(1, await dst.decimals())

  log(``)
  log(`Price for ${srcStr}/${dstStr}`, { indent: 1 })

  const answer = await diamond.getPriceFor(srcAddress, dstAddress)
  const price = FN.from(answer).divUnsafe(FN.from(dstFactor))
  let value = price
  if (args.amount) {
    const valueFor = await diamond.getValueFor(
      srcAddress,
      dstAddress,
      // eslint-disable-next-line @typescript-eslint/no-base-to-string
      BN.from(
        ethers.utils.parseUnits(
          BN.from(args.amount).toString(),
          await src.decimals()
        )
      )
    )
    value = FN.from(valueFor.toString()).divUnsafe(FN.from(dstFactor))
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
