// JS Libraries
const withData = require('leche').withData;
const abi = require('ethereumjs-abi')
const {
  t,
  NULL_ADDRESS,
} = require('../utils/consts');
const { createLoanRequest, createUnsignedLoanResponse } = require('../utils/structs');
const LendingPoolEncoder = require('../utils/encoders/LendingPoolEncoder');
const ATMSettingsEncoder = require('../utils/encoders/ATMSettingsEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenEncoder')
const { createTestSettingsInstance } = require('../utils/settings-helper');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");
const Settings = artifacts.require("./base/Settings.sol");
const LoanTermsConsensus = artifacts.require("./base/LoanTermsConsensus.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract('EtherCollateralLoansGetBorrowerLoansTest', function (accounts) {
    const lendingPoolEncoder = new LendingPoolEncoder(web3);
    const atmSettingsEncoder = new ATMSettingsEncoder(web3);
    const cTokenEncoder = new CTokenInterfaceEncoder(web3)

    let instance;
    let loanTermsConsInstance;
    let lendingPoolInstance;
    let loanTermsConsTemplate;
    let processRequestEncoding;
    let settingsInstance;
    let lendingTokenInstance;
    let collateralTokenInstance;
    let atmSettingsInstance;

    const owner = accounts[0];
    const borrowerAddress = accounts[2];
    const AMOUNT_LOAN_REQUEST = 12000;

    let emptyRequest
    let responseOne
    let responseTwo
    let loanRequest
    
    beforeEach('Setup for each test', async () => {
        lendingTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        loanTermsConsInstance = await Mock.new();
        collateralTokenInstance = await Mock.new();
        settingsInstance = await createTestSettingsInstance(
            Settings,
            {
                from: owner,
                Mock,
                initialize: true,
                onInitialize: async (instance, { atmSettings }) => {
                    atmSettingsInstance = atmSettings
                },
            },
            {}
        );

        const loanLib = await LoanLib.new();
        await Loans.link("LoanLib", loanLib.address);
        instance = await Loans.new();
        await instance.initialize(
            lendingPoolInstance.address,
            loanTermsConsInstance.address,
            settingsInstance.address,
            collateralTokenInstance.address,
        )
        responseOne = createUnsignedLoanResponse(accounts[3], 0, 1234, 6500, 10000, 3, loanTermsConsInstance.address)
        responseTwo = createUnsignedLoanResponse(accounts[4], 0, 1500, 6000, 10000, 2, loanTermsConsInstance.address)
        loanRequest = createLoanRequest(borrowerAddress, NULL_ADDRESS, 3, AMOUNT_LOAN_REQUEST, 4, 19, loanTermsConsInstance.address)
        emptyRequest = createLoanRequest(NULL_ADDRESS, NULL_ADDRESS, 0, 0, 0, 0, loanTermsConsInstance.address)

        loanTermsConsTemplate = await LoanTermsConsensus.new()
        processRequestEncoding = loanTermsConsTemplate
            .contract
            .methods
            .processRequest(emptyRequest, [responseOne])
            .encodeABI();
        
        const encodeLendingToken = lendingPoolEncoder.encodeLendingToken();
        lendingPoolInstance.givenMethodReturnAddress(encodeLendingToken, lendingTokenInstance.address);

        const atmForMarketInstance = await Mock.new();
        atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeGetATMForMarket(),
            atmForMarketInstance.address
        );
    });

    withData({
        _1_valid_no_msg_value: [AMOUNT_LOAN_REQUEST, 3, 0],
        _2_valid_with_msg_value: [AMOUNT_LOAN_REQUEST, 17, 500000],
    }, function(assetSettingAmount, mockLoanIDCounter, msgValue) {
        it(t('user', 'getBorrowerLoans', 'Should able to get the borrower loan ids.', false), async function() {
            const interestRate = Math.floor((responseOne.interestRate + responseTwo.interestRate) / 2);
            const collateralRatio = Math.floor((responseOne.collateralRatio + responseTwo.collateralRatio) / 2);
            const maxLoanAmount = Math.floor((responseOne.maxLoanAmount + responseTwo.maxLoanAmount) / 2);

            await instance.setLoanIDCounter(mockLoanIDCounter);

            // mock consensus response
            await loanTermsConsInstance.givenMethodReturn(
                processRequestEncoding,
                abi.rawEncode(
                    ['uint256', 'uint256', 'uint256'],
                    [interestRate.toString(), collateralRatio.toString(), maxLoanAmount.toString()]
                )
            )
            const cTokenInstance = await Mock.new();
            await cTokenInstance.givenMethodReturnAddress(
              cTokenEncoder.encodeUnderlying(),
              lendingTokenInstance.address
            )
            await settingsInstance.createAssetSettings(
                lendingTokenInstance.address,
                cTokenInstance.address,
                assetSettingAmount,
                {
                    from: owner
                }
            );
            await instance.createLoanWithTerms(
                loanRequest,
                [responseOne, responseTwo],
                msgValue,
                {
                    from: borrowerAddress,
                    value: msgValue
                }
            );

            // Invocation
            const borrowedLoans = await instance.getBorrowerLoans(borrowerAddress);

            // Assertions
            assert.equal(borrowedLoans[0].toString(), mockLoanIDCounter.toString());
            assert.equal(borrowedLoans.length, 1);
        });
    });
});
