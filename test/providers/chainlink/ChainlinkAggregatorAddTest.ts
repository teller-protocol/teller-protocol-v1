// JS Libraries
import { assert } from 'chai'
import { withData } from 'leche'

import { t } from '../../utils/consts'
import { deployChainlink } from '../../utils/setup/chainlink'
import { ChainlinkAggregatorInstance, SettingsInstance } from '../../../types/truffle-contracts'

const Mock = artifacts.require('Mock')

contract('ChainlinkAggregatorAddForTest', function (accounts) {
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

  interface ScenarioParameters {
    senderIndex: number,
    duplicate: boolean,
    srcIsContract: boolean,
    dstIsContract: boolean,
    aggIsContract: boolean,
    mustFail: boolean,
    expectedErrorMessage: string | null
  }

  withData<ScenarioParameters>({
    _1_not_pauser: {
      senderIndex: ownerIndex + 1,
      duplicate: false,
      srcIsContract: true,
      dstIsContract: true,
      aggIsContract: true,
      mustFail: true,
      expectedErrorMessage: 'NOT_PAUSER'
    },
    _2_already_exists: {
      senderIndex: ownerIndex,
      duplicate: true,
      srcIsContract: true,
      dstIsContract: true,
      aggIsContract: true,
      mustFail: true,
      expectedErrorMessage: 'CHAINLINK_PAIR_ALREADY_EXISTS'
    },
    _3_src_not_contract: {
      senderIndex: ownerIndex,
      duplicate: false,
      srcIsContract: false,
      dstIsContract: true,
      aggIsContract: true,
      mustFail: true,
      expectedErrorMessage: 'TOKEN_A_NOT_CONTRACT'
    },
    _4_dst_not_contract: {
      senderIndex: ownerIndex,
      duplicate: false,
      srcIsContract: true,
      dstIsContract: false,
      aggIsContract: true,
      mustFail: true,
      expectedErrorMessage: 'TOKEN_B_NOT_CONTRACT'
    },
    _5_aggregator_not_contract: {
      senderIndex: ownerIndex,
      duplicate: false,
      srcIsContract: true,
      dstIsContract: true,
      aggIsContract: false,
      mustFail: true,
      expectedErrorMessage: 'AGGREGATOR_NOT_CONTRACT'
    },
  _6_success: {
      senderIndex: ownerIndex,
      duplicate: false,
      srcIsContract: true,
      dstIsContract: true,
      aggIsContract: true,
      mustFail: false,
      expectedErrorMessage: null
    },
  }, function ({
    senderIndex,
    duplicate,
    srcIsContract,
    dstIsContract,
    aggIsContract,
    mustFail,
    expectedErrorMessage
  }) {
    it(t('chainlink aggregator', 'add', 'Should be able to (or not) add support for a pair to Chainlink.', mustFail), async function () {
      const src = srcIsContract ? (await Mock.new()).address : accounts[4]
      const dst = dstIsContract ? (await Mock.new()).address : accounts[4]
      const agg = aggIsContract ? (await Mock.new()).address : accounts[4]

      try {
        let srcSupported: boolean
        let dstSupported: boolean
        srcSupported = await instance.isTokenSupported(src)
        dstSupported = await instance.isTokenSupported(dst)
        assert(!srcSupported && !dstSupported, 'Tokens should not be supported yet')

        if (duplicate) {
          await instance.add(src, dst, agg, { from: accounts[ownerIndex] })
        }
        await instance.add(src, dst, agg, { from: accounts[senderIndex] })

        srcSupported = await instance.isTokenSupported(src)
        dstSupported = await instance.isTokenSupported(dst)
        assert(srcSupported && dstSupported, 'Tokens not supported')

        assert(!mustFail)
      } catch (error) {
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.message)
      }
    })
  })
})
