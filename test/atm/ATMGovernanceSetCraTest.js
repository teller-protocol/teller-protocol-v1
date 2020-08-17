// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { atmGovernance } = require('../utils/events');

// Mock contracts

// Smart contracts
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");

contract('ATMGovernanceSetCraTest', function (accounts) {
    const owner = accounts[0];
    let instance;

    beforeEach('Setup for each test', async () => {
        instance = await ATMGovernance.new();
        await instance.initialize(owner);
    });

    // Testing values
    const CRA_INITIAL_VALUE = 'b403da227a0de3c2fee769e67217496031a3bbeb'; 
    const EMPTY_CRA = '';

    withData({
        _1_basic: [0, CRA_INITIAL_VALUE, false, undefined, false],
        _2_notSigner: [2, CRA_INITIAL_VALUE, false,  'SignerRole: caller does not have the Signer role', true],
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