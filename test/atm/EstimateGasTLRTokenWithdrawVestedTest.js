// JS Libraries
const withData = require('leche').withData;
const { t  } = require('../utils/consts');
const Timer = require('../../scripts/utils/Timer');
const { tlrToken } = require('../utils/events');
const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const { assert } = require('chai');

 // Mock contracts
 const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const TLRToken = artifacts.require("./TLRToken.sol");

contract('EstimateGasTLRTokenWithdrawVestedTest', function (accounts) {
    const atmSettingsEncoder = new IATMSettingsEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let settingsInstance;
    let atmSettingsInstance;
    let atmInstance;
    let instance;
    const daoAgent = accounts[0];
    const daoMember = accounts[2];
    const timer = new Timer(web3);
    const MAX_VESTINGS_PER_WALLET_TELLER_CONFIG = 50; // refers to: config/network/mainnet/atms.js [maxVestingPerWallet]
    const MAX_VESTINGS_PER_WALLET_SUPPORTED = 500; // MAX amount of vestings in one transaction based on gas limit. We are using
                                                    // only 500 due to test timeout.   
    
    const baseGasCost = 407000; // Gas cost with 1 vesting in wallet
    const expectedGasCost = (vestings) => baseGasCost + ((vestings -  1) * 3550); // Gas cost > 1 vesting in wallet

    beforeEach('Setup for each test', async () => {
        settingsInstance = await Mock.new();
        atmSettingsInstance = await Mock.new();
        await atmSettingsInstance.givenMethodReturnAddress(
            atmSettingsEncoder.encodeSettings(),
            settingsInstance.address
        );
        atmInstance = await Mock.new();
        instance = await TLRToken.new();
        await instance.initialize(
                            "Teller Token",
                            "TLR",
                            18,
                            1000000000,
                            MAX_VESTINGS_PER_WALLET_SUPPORTED,
                            settingsInstance.address,
                            atmInstance.address
                        );
        await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeATMSettings(),
            atmSettingsInstance.address
        );
    });

    withData({
        _1_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 1],
        _2_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 2],
        _3_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 3],
        _4_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 4],
        _5_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 5],
        _6_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 6],
        _7_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 7],
        _8_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 8],
        _9_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 9],
        _10_withdraw_vested: [daoMember, 1000, 2500, 7000, 7001, 10],
        _11_max_vestings_per_wallet_limit: [daoMember, 10, 2500, 7000, 7001, MAX_VESTINGS_PER_WALLET_TELLER_CONFIG],
        _12_max_vestings_gas_limit: [daoMember, 10, 2500, 7000, 7001, MAX_VESTINGS_PER_WALLET_SUPPORTED],
    },function(
        recipient,
        amount,
        cliff,
        vestingPeriod,
        claimTime,
        vestingsMinted,
    ) {
        it(t('user', 'withdrawVested', 'Should be able to withdraw using enough gas'), async function() {

            // Setup 
            // Simulating several vestings minted for wallet to calculate gas change.
            for (let i = 0; i < vestingsMinted; i++) {
                await instance.mintVesting(daoMember, amount, cliff, vestingPeriod, { from: daoAgent });
            }
            const expectedMaxGas = expectedGasCost(vestingsMinted);

            await atmSettingsInstance.givenMethodReturnBool(
                atmSettingsEncoder.encodeIsATMPaused(),
                false
            );
            
            // Invocation
            const currentTime = await timer.getCurrentTimestampInSeconds();
            await timer.advanceBlockAtTime(currentTime + claimTime);
            const result = await instance.withdrawVested.estimateGas({ from: recipient });
            // Assertions
            assert(parseInt(result) <= expectedMaxGas, 'Expected max gas less than result.');
        });
    });

})