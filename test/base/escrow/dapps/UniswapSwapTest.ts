import { assert } from 'chai'
import { withData } from 'leche'

import { deployUniswap, DeployUniswapResponse } from '../../../utils/setup/uniswap'
import {
  DAIMockInstance,
  ERC20MockInstance,
  USDCMockInstance,
} from '../../../../types/truffle-contracts'
import { t } from '../../../utils/consts'
import { uniswap } from '../../../utils/events'

// Mock contracts
const DAI = artifacts.require('DAIMock')
const USDC = artifacts.require('USDCMock')
const ERC20 = artifacts.require('ERC20Mock')

contract('UniswapSwapTest', (accounts) => {
  const ownerIndex = 0

  const DONT_ALTER_BALANCE = 999999
  const SIMULATE_UNISWAP_RESPONSE_ERROR = 777777

  let uniswapResponse: DeployUniswapResponse
  let dai: DAIMockInstance
  let usdc: USDCMockInstance

  before(async () => {
    uniswapResponse = await deployUniswap({
      network: 'test',
      deployerAddress: accounts[ownerIndex]
    })
    dai = await DAI.new()
    usdc = await USDC.new()
  })

  afterEach(async () => {
    await uniswapResponse.resetTokenSupport()
    await uniswapResponse.weth.burnBalance(uniswapResponse.uniswap.address)
    await dai.burnBalance(uniswapResponse.uniswap.address)
    await usdc.burnBalance(uniswapResponse.uniswap.address)
  })

  withData({
    _1_dai_for_usdc: [ ownerIndex, [ 'dai', 'usdc' ], 50, 50, 1, false, null ],
    _2_usdc_for_dai: [ ownerIndex, [ 'usdc', 'dai' ], 50, 50, 1, false, null ],
    _3_weth_for_dai: [ ownerIndex, [ 'weth', 'dai' ], 50, 50, 1, false, null ],
    _4_path_too_short: [ ownerIndex, [ 'dai' ], 0, 0, 0, true, 'UNI_PATH_TOO_SHORT' ],
    _5_source_and_destination_same: [ ownerIndex, [ 'dai', 'dai' ], 0, 0, 0, true, 'UNI_SRC_DST_SAME' ],
    _6_min_destination_zero: [ ownerIndex, [ 'usdc', 'dai' ], 0, 0, 0, true, 'UNI_MIN_DST_ZERO' ],
    _7_insufficient_source: [ ownerIndex, [ 'dai', 'usdc' ], 50, 0, 1, true, 'UNI_INSUFFICIENT_SRC' ],
    _8_swapping_error: [ ownerIndex, [ 'usdc', 'dai' ], 50, 50, SIMULATE_UNISWAP_RESPONSE_ERROR, true, 'UNI_ERROR_SWAPPING' ],
    _9_balance_error: [ ownerIndex, [ 'usdc', 'dai' ], 50, 50, DONT_ALTER_BALANCE, true, 'UNI_BALANCE_NOT_INCREASED' ],
    _10_unsupported_source_token: [ ownerIndex, [ 'unsupported', 'dai' ], 50, 50, 1, true, 'UNI_SRC_NOT_SUPPORTED' ],
    _11_unsupported_destination_token: [ ownerIndex, [ 'dai', 'unsupported' ], 50, 50, 1, true, 'UNI_DST_NOT_SUPPORTED' ],
  }, function (
    senderAccount: number,
    path: string[],
    sourceAmount: number,
    sourceBalance: number,
    minDestination: number,
    mustFail: boolean,
    expectedErrorMessage: string | null
  ) {
    it(t('uniswap', 'swap', 'Should be able (or not) to swap tokens on Uniswap', mustFail), async function () {
      // Setup
      const unsupportedToken = await ERC20.new('', '', 0, 0)
      const tokens = {
        weth: uniswapResponse.weth,
        dai,
        usdc
      }
      const srcToken: ERC20MockInstance = tokens[path[0]]
      const dstToken: ERC20MockInstance = tokens[path[path.length - 1]]
      if (srcToken) {
        await uniswapResponse.mockTokenSupport(srcToken)

        if (sourceBalance > 0) {
          await srcToken.mint(uniswapResponse.uniswap.address, sourceBalance)
        }
      }
      if (dstToken) {
        await uniswapResponse.mockTokenSupport(dstToken)
      }
      path = path.map((name) => (tokens[name] ?? unsupportedToken).address)

      try {
        // Invocation using Mock as proxy to access internal functions
        const result = await uniswapResponse.uniswap.swap(path, sourceAmount, minDestination, { from: accounts[senderAccount] })
        assert(!mustFail, 'It should have failed because data is invalid.')

        // State updates are validated inside the dApp contract and events emitted

        // Validating state updates and events
        uniswap
          .uniswapSwapped(result)
          .emitted(
            path[0],
            path[path.length - 1],
            sourceAmount
          )
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage)
      }
    })
  })
})
