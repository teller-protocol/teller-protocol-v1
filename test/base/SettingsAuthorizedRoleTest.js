// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { createTestSettingsInstance } = require('../utils/settings-helper');
const { assert } = require('chai');
const {
    lendingPool
} = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const DAIMock = artifacts.require("./mock/token/DAIMock.sol")
const TTokenMock = artifacts.require("./mock/token/ERC20Mock.sol")

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('SettingsAuthorizedRoleTest', function (accounts) {
    const ownerIndex = 0;
    const owner = accounts[ownerIndex];
    let instance;
    let lendingPoolInstance;
    let tTokenInstance;
    let daiInstance;

    beforeEach('Setup for each test', async () => {
        instance = await createTestSettingsInstance(Settings, { from: owner, Mock });
        await instance.restrictPlatform(true, { from: owner });
        lendingPoolInstance = await LendingPool.new();
        tTokenInstance = await TTokenMock.new('','', 18, 10000);
        daiInstance = await DAIMock.new();
        await lendingPoolInstance.initialize(
            tTokenInstance.address,
            daiInstance.address,
            (await Mock.new()).address,
            (await Mock.new()).address,
            instance.address
        )
    });

    withData({
        _1_is_owner: [ownerIndex, false, true, null, false],
        _2_is_authorized: [2, true, true, undefined, false],
        _3_is_not_authorized: [1, false, false, 'CALLER_NOT_AUTHORIZED', true],
    }, function(addressIndex, callAddAuthorized, expectedResponse, expectedErrorMessage, mustFail) {
        it(t('user', 'hasAuthorization', 'Should (or not) have the Authorized role.', mustFail), async function() {
            // Setup
            const address = accounts[addressIndex];

            try {
                // Invocation
                if (callAddAuthorized && address != owner) {
                    await instance.addAuthorizedAddress(address);
                    const hasAuthorizationRole = await instance.hasAuthorization(address);
                    // Assertions
                    assert.equal(hasAuthorizationRole, expectedResponse, 'Authorization role not correct.')
                }
                // Check if sender can deposit to lending pool if authorized
                await daiInstance.mint(address, 1000);
                await daiInstance.approve(lendingPoolInstance.address, 1000, { from: address });
                const result = await lendingPoolInstance.deposit(
                    1000,
                    { from: address }
                );
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                lendingPool
                    .tokenDeposited(result)
                    .emitted(address, 1000);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
}); 