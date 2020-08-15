// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const ATMSettingsInterfaceEncoder = require('../utils/encoders/ATMSettingsInterfaceEncoder');
const MarketsStateInterfaceEncoder = require('../utils/encoders/MarketsStateInterfaceEncoder');
const ATMGovernanceInterfaceEncoder = require('../utils/encoders/ATMGovernanceInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

contract('LoansBaseIsSupplyToDebtRatioValidTest', function (accounts) {
    const atmSettingsInterfaceEncoder = new ATMSettingsInterfaceEncoder(web3);
    const marketsStateInterfaceEncoder = new MarketsStateInterfaceEncoder(web3);
    const atmGovernanceInterfaceEncoder = new ATMGovernanceInterfaceEncoder(web3);
    let instance;
    let oracleInstance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let settingsInstance;
    let marketsInstance;
    let atmSettingsInstance;
    
    beforeEach('Setup for each test', async () => {
        lendingPoolInstance = await Mock.new();
        oracleInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        settingsInstance = await Mock.new();
        marketsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        instance = await Loans.new();
        await instance.initialize(
            oracleInstance.address,
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            marketsInstance.address,
            atmSettingsInstance.address,
        )
    });

    withData({
        _1_basic: [1500, false, 5000, 4500, true, undefined, false],
        _2_std_high_1: [1500, false, 4500, 5501, false, undefined, false],
        _3_std_high_2: [1500, false, 4500, 4501, false, undefined, false],
        _4_empty_atm_governance: [1500, true, 5000, 4500, false, 'ATM_NOT_FOUND_FOR_MARKET', true],
    }, function(
        loanAmount,
        useEmptyATMGovernanceAddress,
        getGeneralSettingResponse,
        getSupplyToDebtForResponse,
        expectedResult,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', '_isSupplyToDebtRatioValid', 'Should able to test whether is StD ratio is valid or not.', mustFail), async function() {
            // Setup
            const atmGovernanceInstance = await Mock.new();
            const atmGovernanceAddress = useEmptyATMGovernanceAddress ? NULL_ADDRESS : atmGovernanceInstance.address;
            await atmSettingsInstance.givenMethodReturnAddress(
                atmSettingsInterfaceEncoder.encodeGetATMForMarket(),
                atmGovernanceAddress,
            );
            await atmGovernanceInstance.givenMethodReturnUint(
                atmGovernanceInterfaceEncoder.encodeGetGeneralSetting(),
                getGeneralSettingResponse,
            );
            await marketsInstance.givenMethodReturnUint(
                marketsStateInterfaceEncoder.encodeGetSupplyToDebtFor(),
                getSupplyToDebtForResponse,
            );

            try {
                // Invocation
                const result = await instance.externalIsSupplyToDebtRatioValid(loanAmount);

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert.equal(result.toString(), expectedResult.toString());
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert(error.message.includes(expectedErrorMessage));
            }
        })

    })

})