// JS Libraries
const { createTestSettingsInstance } = require("../utils/settings-helper");
const withData = require('leche').withData;
const { t, encode } = require('../utils/consts');
const { atmGovernance } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract('ATMGovernanceSetCraTest', function (accounts) {
    let instance;

    beforeEach('Setup for each test', async () => {
        const settings = await createTestSettingsInstance(Settings);
        const atmSettings = await Mock.new();
        await atmSettings.givenMethodReturnAddress(
            encode(web3, 'settings()'),
            settings.address
        );

        instance = await ATMGovernance.new();
        await instance.initialize(atmSettings.address);
    });

    // Testing values
    const CRA_INITIAL_VALUE = 'b403da227a0de3c2fee769e67217496031a3bbeb'; 
    const EMPTY_CRA = '';

    withData({
        _1_basic: [0, CRA_INITIAL_VALUE, false, undefined, false],
        _2_notSigner: [2, CRA_INITIAL_VALUE, false,  'ONLY_SIGNER', true],
        _3_notEmpty: [0, EMPTY_CRA, false, 'CRA_CANT_BE_EMPTY', true],
        _3_sameAsOld: [0, CRA_INITIAL_VALUE, true, 'CRA_SAME_AS_OLD', true],
    }, function (senderIndex, cra, repeatInsert, expectedErrorMessage, mustFail) {
        it(t('user', 'setCra', 'Should (or not) be able to set a CRA - credit risk algorithm.', mustFail), async function () {
            // Setup
            const sender = accounts[senderIndex];

            try {
                // Invocation
                const result = await instance.setCRA(cra, { from: sender });
                if (repeatInsert) {
                    await instance.setCRA(cra, { from: sender });
                }

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                // Validating state variables were modified
                const aSettingValue = await instance.getCRA();
                assert.equal(aSettingValue, cra);

                // Validating events were emitted
                atmGovernance
                    .CRASet(result)
                    .emitted(sender, cra);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

});