// JS Libraries
const withData = require("leche").withData;
const { t, createMocks } = require("../utils/consts");
const assert = require("assert");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const ATMGovernanceMockV2 = artifacts.require("./mock/atm/ATMGovernanceMockV2.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const ATMGovernance = artifacts.require("./atm/ATMGovernance.sol");
const Settings = artifacts.require("./base/Settings.sol");
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");

contract("ATMFactorySetATMGovernanceTemplateUpgradeToTest", function (accounts) {
    const ADMIN_INDEX = 0;
    let admin;
    let instance;

    beforeEach("Setup for each test", async () => {
        mocks = await createMocks(Mock, 10);
        admin = accounts[ADMIN_INDEX];
        const settings = await Settings.new();
        await settings.initialize(admin);
        instance = await ATMFactory.new();
        const atmSettings = await Mock.new();
        const atmTokenTemplate = await Mock.new();
        const atmGovernanceTemplate = await Mock.new();
        await instance.initialize(
            settings.address,
            atmSettings.address,
            atmTokenTemplate.address,
            atmGovernanceTemplate.address,
        );
        initialSettingsAddress = await instance.settings();
    });

    const newATM = (name, symbol = name, decimals = 18, cap = 10000000000, maxVesting = 10) => ({name, symbol, decimals, cap, maxVesting});

    withData({
        _1_basic: [
            [newATM('ATM1_1')], 0, undefined, false
        ],
        _2_two_atms: [
            [newATM('ATM2_1'), newATM('ATM2_1')], 0, undefined, false
        ],
    }, function(
        atmsData,
        senderIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "setATMGovernanceTemplate#2", "Should be able (or not) to set atm governance template", mustFail), async function() {
            // Setup
            for (const atmData of atmsData) {
                await instance.createATM(
                    atmData.name,
                    atmData.symbol,
                    atmData.decimals,
                    atmData.cap,
                    atmData.maxVesting,
                    { from : admin }
                );
            }
            const sender = accounts[senderIndex];
            
            const newAtmGovernanceTemplate = await ATMGovernanceMockV2.new();
            const newAtmGovernanceTemplateAddress = newAtmGovernanceTemplate.address;
            await instance.setATMGovernanceTemplate(
                newAtmGovernanceTemplateAddress,
                { from: sender }
            );
            const atmProxiesList = await instance.getATMs();
            assert.equal(atmProxiesList.length, atmsData.length);
            try {
                for (const atmProxyAddress of atmProxiesList) {
                    const atmUpgradeableProxy = await UpgradeableProxy.at(atmProxyAddress);

                    // Invocation
                    const result = await atmUpgradeableProxy.upgradeTo(
                        newAtmGovernanceTemplateAddress,
                        { from: admin }
                    );

                    // Assertions
                    assert(!mustFail, "It should have failed because data is invalid.");
                    assert(result);
                    const atmUpgradeableV1 = await ATMGovernance.at(atmProxyAddress);
                    const atmUpgradeableV2 = await ATMGovernanceMockV2.at(atmProxyAddress);
                    await atmUpgradeableV2.initialize(admin, { from: admin });

                    const newImplementationV2 = await atmUpgradeableProxy.implementation.call();
                    assert.equal(newImplementationV2, newAtmGovernanceTemplateAddress, "V2 implementation addresses do not match");

                    const newValue = (await Mock.new()).address.toString();
                    const number = 1234567890;
                    await atmUpgradeableV2.setNewValue(newValue);
                    await atmUpgradeableV2.addNewMapping(newValue, number.toString())
                    await atmUpgradeableV2.setCRA(newValue);

                    const updatedCRA = await atmUpgradeableV1.getCRA();
                    assert.equal(updatedCRA, newValue);
                    const updatedNewValue = await atmUpgradeableV2.getNewValue();
                    assert.equal(updatedNewValue, newValue);
                    const updatedMappingValue = await atmUpgradeableV2.newMapping(newValue.toString());
                    assert.equal(number.toString(), updatedMappingValue.toString());
                }
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});