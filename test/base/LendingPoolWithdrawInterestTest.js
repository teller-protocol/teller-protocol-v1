// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const BurnableInterfaceEncoder = require('../utils/encoders/BurnableInterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');
const InterestValidatorInterfaceEncoder = require('../utils/encoders/InterestValidatorInterfaceEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenInterfaceEncoder')

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");
const LendingPool = artifacts.require("./base/LendingPool.sol");

contract('LendingPoolWithdrawInterestTest', function (accounts) {
    const burnableInterfaceEncoder = new BurnableInterfaceEncoder(web3);
    const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
    const interestValidatorInterfaceEncoder = new InterestValidatorInterfaceEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    const cTokenEncoder = new CTokenInterfaceEncoder(web3)

    let instance;
    let tTokenInstance;
    let lendingTokenInstance;
    let loansInstance;
    let consensusInstance;
    let settingsInstance;
    let cTokenInstance;
    let lendersInstance;
    let marketsInstance;
    let interestValidatorInstance;
    
    beforeEach('Setup for each test', async () => {
        loansInstance = await Mock.new();
        consensusInstance = await Mock.new();
        settingsInstance = await Mock.new();
        tTokenInstance = await Mock.new();
        lendingTokenInstance = await Mock.new();
        cTokenInstance = await Mock.new()
        lendersInstance = await Lenders.new();
        marketsInstance = await Mock.new();
        interestValidatorInstance = await Mock.new();

        await cTokenInstance.givenMethodReturnAddress(
          cTokenEncoder.encodeUnderlying(),
          lendingTokenInstance.address
        )

        instance = await LendingPool.new();
        await lendersInstance.initialize(
            tTokenInstance.address,
            instance.address,
            consensusInstance.address,
            settingsInstance.address,
        );
    });

    withData({
        _1_cTokenSupported_basic: [true, accounts[0], true, true, 10, 10, 10, false, { supported: false, isValid: true }, undefined, false],
        _2_cTokenSupported_basic: [true, accounts[0], true, true, 40, 30, 25, false, { supported: false, isValid: true }, 'AMOUNT_EXCEEDS_AVAILABLE_AMOUNT', true],
        _3_cTokenSupported_basic: [true, accounts[0], true, true, 40, 25, 30, false, { supported: false, isValid: true }, undefined, false],
        _4_cTokenSupported_transferFail: [true, accounts[1], true, false, 50, 50, 50, false, { supported: false, isValid: true }, 'LENDING_TRANSFER_FAILED', true],
        _5_cTokenSupported_notEnoughBalance: [true, accounts[1], true, true, 49, 50, 50, true, { supported: false, isValid: true }, 'COMPOUND_WITHDRAWAL_ERROR', true],
        _6_cTokenSupported_notEqualAddresses: [false, accounts[1], true, true, 49, 50, 50, true, { supported: false, isValid: true }, 'SENDER_ISNT_LENDING_POOL', true],
        _7_cTokenNotSupported_basic: [true, accounts[0], false, true, 10, 10, 10, false, { supported: false, isValid: true }, undefined, false],
        _8_cTokenNotSupported_basic: [true, accounts[0], false, true, 40, 30, 25, false, { supported: false, isValid: true }, 'AMOUNT_EXCEEDS_AVAILABLE_AMOUNT', true],
        _9_cTokenNotSupported_basic: [true, accounts[0], false, true, 40, 25, 30, false, { supported: false, isValid: true }, undefined, false],
        _10_cTokenNotSupported_transferFail: [true, accounts[1], false, false, 50, 50, 50, false, { supported: false, isValid: true }, 'LENDING_TRANSFER_FAILED', true],
        _11_cTokenNotSupported_notEqualAddresses: [false, accounts[1], true, true, 49, 50, 50, false, { supported: false, isValid: true }, 'SENDER_ISNT_LENDING_POOL', true],
        _12_validatorSupportedAndValid_valid: [true, accounts[0], true, true, 40, 25, 30, false, { supported: true, isValid: true }, undefined, false],
        _13_validatorSupportedAndNotValid_invalid: [true, accounts[0], true, true, 40, 25, 30, false, { supported: true, isValid: false }, 'INTEREST_TO_WITHDRAW_IS_INVALID', true],
    }, function(
        areAddressesEqual,
        lender,
        isCTokenSupported,
        transfer,
        currentBalanceOf,
        amountToWithdraw,
        totalNotWithdrawn,
        compoundFails,
        interestValidatorInfo,
        expectedErrorMessage,
        mustFail
    ) {
        it(t('user', 'withdrawInterest', 'Should able (or not) to withdraw the interest.', mustFail), async function() {
            // Setup
            const cTokenAddress = isCTokenSupported ? cTokenInstance.address : NULL_ADDRESS;

            const interestValidatorAddress = interestValidatorInfo.supported ? interestValidatorInstance.address : NULL_ADDRESS;
            await settingsInstance.givenMethodReturnAddress(
                settingsInterfaceEncoder.encodeInterestValidator(),
                interestValidatorAddress
            );
            if(interestValidatorInfo.supported) {
                const encodeIsInterestValid = interestValidatorInterfaceEncoder.encodeIsInterestValid();
                await interestValidatorInstance.givenMethodReturnBool(encodeIsInterestValid, interestValidatorInfo.isValid);
            }
            await instance.initialize(
                tTokenInstance.address,
                lendingTokenInstance.address,
                lendersInstance.address,
                loansInstance.address,
                cTokenAddress,
                settingsInstance.address,
            );
            await lendersInstance.mockLenderInfo(
                lender,
                Math.floor(Date.now() / 1000),
                totalNotWithdrawn,
                totalNotWithdrawn
            );
            await lendersInstance.mockAddressesEqual(areAddressesEqual);

            const redeemResponse = compoundFails ? 1 : 0
            const encodeRedeemUnderlying = compoundInterfaceEncoder.encodeRedeemUnderlying();
            await cTokenInstance.givenMethodReturnUint(encodeRedeemUnderlying, redeemResponse)

            const encodeTransfer = burnableInterfaceEncoder.encodeTransfer();
            await lendingTokenInstance.givenMethodReturnBool(encodeTransfer, transfer);
            const encodeBalanceOf = burnableInterfaceEncoder.encodeBalanceOf();
            await lendingTokenInstance.givenMethodReturnUint(encodeBalanceOf, currentBalanceOf.toString());

            try {
                // Invocation
                const result = await instance.withdrawInterest(amountToWithdraw, { from: lender });

                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                const interestWithdrawn = totalNotWithdrawn > amountToWithdraw ? amountToWithdraw : totalNotWithdrawn;
                lendingPool
                    .interestWithdrawn(result)
                    .emitted(lender, interestWithdrawn);

            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});