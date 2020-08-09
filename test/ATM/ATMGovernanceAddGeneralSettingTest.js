// JS Libraries
const withData = require('leche').withData;
const { t, toBytes32 } = require('../utils/consts');
const { atmGovernance } = require('../utils/events');

// Mock contracts

// Smart contracts
const ATMGovernance = artifacts.require("./ATM/ATMGovernance.sol");

contract('ATMGovernanceAddGeneralSettingTest', function (accounts) {
    let instance;
    
    beforeEach('Setup for each test', async () => {
        instance = await ATMGovernance.new();
    });

    // Testing values
    const SETTING_NAME = toBytes32(web3, 'supplyToDebtRatio'); 
    const SETTING_VALUE = 5044;
    const EMPTY_SETTING_NAME = toBytes32(web3, '');

    withData({
        _1_basic: [0, SETTING_NAME, SETTING_VALUE, false, undefined, false],
        _2_notSigner: [2, SETTING_NAME, SETTING_VALUE, false, 'SignerRole: caller does not have the Signer role', true],
        _3_emptySettingName: [0, EMPTY_SETTING_NAME, SETTING_VALUE, false, 'GENERAL_SETTING_MUST_BE_PROVIDED', true],
        _4_notAddingWhenPaused: [0, SETTING_NAME, SETTING_VALUE, true, 'Pausable: paused', true],
        _5_notPauserTryPausing: [2, SETTING_NAME, SETTING_VALUE, true, 'PauserRole: caller does not have the Pauser role', true],
    }, function(senderIndex, settingName, settingValue, isPaused, expectedErrorMessage, mustFail) {
        it(t('user', 'addGeneralSetting', 'Should (or not) be able to add a general setting.', mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            
            try {
                if (isPaused) {
                    await instance.pause({ from: sender })
                }
                // Invocation
                const result = await instance.addGeneralSetting(settingName, settingValue, { from: sender });
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                
                // Validating state variables were modified
                const aSettingValue = await instance.getGeneralSetting(SETTING_NAME);
                assert.equal(aSettingValue, SETTING_VALUE);
                
                // Validating events were emitted
                atmGovernance
                    .generalSettingAdded(result)
                    .emitted(sender, SETTING_NAME, SETTING_VALUE);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });


    
});