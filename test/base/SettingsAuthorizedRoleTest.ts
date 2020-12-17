// JS Libraries
import { withData } from 'leche'
import { assert } from 'chai'

import { t } from '../utils/consts'
import { deploySettings } from '../utils/setup/settings'
import { SettingsInstance, UpgradableV1Instance } from '../../types/truffle-contracts'

const UpgradeableProxy = artifacts.require("UpgradeableProxy")
const UpgradeableV1 = artifacts.require("UpgradableV1")
const Mock = artifacts.require("Mock")

contract('SettingsAuthorizedRoleTest', function (accounts) {
  const ownerIndex = 0
  const owner = accounts[ownerIndex]
  let instance: SettingsInstance
  let upgradeable: UpgradableV1Instance

  before(async () => {
    const { settings } = await deploySettings({
      network: 'test',
      deployerAddress: owner
    })
    instance = settings

    const mock = await Mock.new()
    const base = await UpgradeableProxy.new()
    await base.initializeProxy(instance.address, mock.address)
    upgradeable = await UpgradeableV1.at(base.address)
  })

  withData<{
    isRestricted: boolean
    addressIndex: number
    callAddAuthorized: boolean
    expectedErrorMessage?: string
    mustFail?: boolean
  }>({
    _1_is_not_authorized: {
      isRestricted: true,
      addressIndex: ownerIndex + 2,
      callAddAuthorized: false,
      expectedErrorMessage: 'NOT_AUTHORIZED',
      mustFail: true
    },
    _2_is_owner: {
      isRestricted: true,
      addressIndex: ownerIndex,
      callAddAuthorized: false,
    },
    _3_is_authorized: {
      isRestricted: true,
      addressIndex: ownerIndex + 1,
      callAddAuthorized: true,
    },
    _4_not_restricted: {
      isRestricted: false,
      addressIndex: ownerIndex + 2,
      callAddAuthorized: false,
    },
  }, function ({
    isRestricted,
    addressIndex,
    callAddAuthorized,
    expectedErrorMessage,
    mustFail = false
  }) {
    it(t('user', 'hasAuthorization', 'Should (or not) have the Authorized role.', mustFail), async function () {
      // Setup
      const address = accounts[addressIndex]
      await instance.restrictPlatform(isRestricted, { from: owner })

      if (callAddAuthorized && address !== owner) {
        await instance.addAuthorizedAddress(address, { from: owner })
      }

      try {
        // Invocation
        // Could be an contract/function. Testing the execution of the Proxy fallback function.
        await upgradeable.sendToken(upgradeable.address, upgradeable.address, '0', { from: address })

        assert(!mustFail, 'It should have failed because data is invalid.')
      } catch (error) {
        // Assertions
        assert(mustFail, error.message)
        assert.equal(error.reason, expectedErrorMessage, error.message)
      }
    })
  })
})
