// JS Libraries
import { assert } from 'chai'
const withData = require('leche').withData

const { t } = require('../../utils/consts')
import { deployChainlink } from '../../utils/setup/chainlink'
import { ChainlinkAggregatorInstance, SettingsInstance } from '../../../types/truffle-contracts'

const Mock = artifacts.require('Mock')

contract('ChainlinkAggregatorRemoveForTest', function (accounts) {
  const ownerIndex = 0

  let instance: ChainlinkAggregatorInstance
  let settings: SettingsInstance

  before(async () => {
    const response = await deployChainlink({
      deployerAddress: accounts[ownerIndex],
      network: 'test'
    })
    settings = response.settings
    instance = response.chainlinkAggregator
  })

  async function createTokens(count: number): Promise<string[]> {
    const arr: string[] = []
    for (let i = 0; i < count; i++) {
      const mock = await Mock.new()
      arr.push(mock.address)
    }
    return arr
  }

  withData({
    _1_not_pauser: [ ownerIndex + 1, 1, 1, true, 'NOT_PAUSER' ],
    _2_src_1_dst_1: [ ownerIndex, 1, 1, false, null ],
    _3_src_1_dst_2: [ ownerIndex, 1, 2, false, null ],
    _3_src_2_dst_1: [ ownerIndex, 2, 1, false, null ],
  }, function (
    senderIndex: string,
    srcMarkets: number,
    dstMarkets: number,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('chainlink aggregator', 'remove', 'Should be able to (or not) remove support for a pair to Chainlink.', mustFail), async function () {
      // NOTE: creating 2 source markets means there is 1 source token and multiple destination tokens
      const srcAddresses = await createTokens(dstMarkets)
      const dstAddresses = await createTokens(srcMarkets)

      for (const srcAddress of srcAddresses) {
        for (const dstAddress of dstAddresses) {
          await instance.add(srcAddress, dstAddress, srcAddress, { from: accounts[ownerIndex] })
        }
      }

      try {
        await instance.methods['remove(address,address)'](srcAddresses[0], dstAddresses[0], { from: accounts[senderIndex] })

        const srcSupported = await instance.isTokenSupported(srcAddresses[0])
        const dstSupported = await instance.isTokenSupported(dstAddresses[0])
        if (srcMarkets > 1) {
          assert(srcSupported, 'Source token should still be supported')
        } else {
          assert(!srcSupported, 'Source token still supported')
        }
        if (dstMarkets > 1) {
          assert(dstSupported, 'Destination token should still be supported')
        } else {
          assert(!dstSupported, 'Destination token still supported')
        }

        assert(!mustFail)
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.message)
      }
    })
  })

  withData({
    _1_not_pauser: [ ownerIndex + 1, 1, true, 'NOT_PAUSER' ],
    _2_1_market: [ ownerIndex, 1, false, null ],
    _3_2_markets: [ ownerIndex, 2, false, null ],
  }, function (
    senderIndex: string,
    markets: number,
    mustFail,
    expectedErrorMessage
  ) {
    it(t('chainlink aggregator', 'remove', 'Should be able to (or not) remove support for all markets for a token.', mustFail), async function () {
      // NOTE: creating 2 source markets means there is 1 source token and multiple destination tokens
      const [ srcAddress ] = await createTokens(1)
      const dstAddresses = await createTokens(markets)

      for (const dstAddress of dstAddresses) {
        await instance.add(srcAddress, dstAddress, srcAddress, { from: accounts[ownerIndex] })
      }

      try {
        await instance.methods['remove(address)'](srcAddress, { from: accounts[senderIndex] })

        const srcSupported = await instance.isTokenSupported(srcAddress)
        assert(!srcSupported, 'Source token still supported')

        assert(!mustFail)
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.message)
      }
    })
  })
})
