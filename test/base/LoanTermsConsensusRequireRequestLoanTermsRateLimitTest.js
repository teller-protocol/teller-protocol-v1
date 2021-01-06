// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { createLoanRequest } = require('../utils/structs');
const { NULL_ADDRESS } = require('../utils/consts');
const SettingsEncoder = require('../utils/encoders/SettingsEncoder');
const Timer = require('../../scripts/utils/Timer');

// Smart contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const SettingsMock = artifacts.require("./mock/base/SettingsMock.sol");
const LoanTermsConsensusMock = artifacts.require("./mock/base/LoanTermsConsensusMock.sol");

contract('LoanTermsConsensusRequireRequestLoanTermsRateLimitTest', function (accounts) {
    const settingsEncoder = new SettingsEncoder(web3);
    const timer = new Timer(web3);
    const owner = accounts[1];
    let instance
    let settingsInstance;
    let callerInstance;

    beforeEach('Setup for each test', async () => {
        settingsInstance = await SettingsMock.new();
        callerInstance = await Mock.new();
        instance = await LoanTermsConsensusMock.new();
        await instance.initialize(
            owner,
            callerInstance.address,
            settingsInstance.address
        );
    })

    withData({
        _1_basic_same_time: [false, 200, 200, undefined, false],
        _2_basic: [false, 200, 300, undefined, false],
        _3_invalid: [false, 300, 100, 'REQS_LOAN_TERMS_LMT_EXCEEDS_MAX', true],
        _4_first_time: [true, 200, 0, undefined, false],
    }, function(
        isFirstTime,
        currentSetting,
        lastLoanTermsRequestedSecondsBack,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'requireRequestLoanTermsRateLimit', 'Should validate if request loan terms rate limit is valid or not.', mustFail), async function() {
            const borrower = accounts[2];
            const recipient = NULL_ADDRESS;
            const request = createLoanRequest(borrower, recipient, 234764, 344673177, 34467317723, 234534, instance.address)
            const currentTimestamp = isFirstTime ? 0 : (await timer.getCurrentTimestampInSeconds());
            const lastLoanTermsRequested = currentTimestamp - lastLoanTermsRequestedSecondsBack;

            await instance.mockBorrowerToLastLoanTermRequest(
                borrower,
                lastLoanTermsRequested,
            );
            
            await settingsInstance.givenMethodReturnUint(
                settingsEncoder.encodeGetPlatformSettingValue(),
                currentSetting,
            );
            try {

                // Invocation
                const result = await instance.externalRequireRequestLoanTermsRateLimit(request);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert(error.message.includes(expectedErrorMessage));
            }
        });
    });
});
