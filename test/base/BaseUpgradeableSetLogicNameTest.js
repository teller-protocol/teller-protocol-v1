// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, toBytes32 } = require('../utils/consts');
const LogicVersionsRegistryEncoder = require('../utils/encoders/LogicVersionsRegistryEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const { assert } = require('chai');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");
const BaseUpgradeableMock = artifacts.require("./mock/base/BaseUpgradeableMock.sol");

// Smart contracts

contract('BaseUpgradeableSetLogicNameTest', function (accounts) {
    const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);
    const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
    let instance;
    let versionsRegistry;
    
    beforeEach('Setup for each test', async () => {
        const settings = await Mock.new();
        versionsRegistry = await Mock.new();
        instance = await BaseUpgradeableMock.new();
        await instance.externalSetSettings(settings.address);

        await settings.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeVersionsRegistry(),
            versionsRegistry.address
        );
    });

    withData({
        _1_valid: [undefined, "LogicName1", true, undefined, false],
        _2_previous: ['MyPrevious', "LogicName2", true, undefined, false],
        _3_logic_name_not_present: [undefined, "LogicName3", false,  'LOGIC_NAME_NOT_EXIST', true],
    }, function(previousLogicName, logicName, hasLogicVersion, expectedErrorMessage, mustFail) {
        it(t('user', 'setLogicName', 'Should (or not) be able to set the logic name.', mustFail), async function() {
            // Setup
            if(previousLogicName !== undefined){
                await versionsRegistry.givenMethodReturnBool(
                    logicVersionsRegistryEncoder.encodeHasLogicVersion(),
                    true
                );
                const previousLogicNameBytes32 = toBytes32(web3, previousLogicName);
                await instance.externalSetLogicName(previousLogicNameBytes32);
            }
            await versionsRegistry.givenMethodReturnBool(
                logicVersionsRegistryEncoder.encodeHasLogicVersion(),
                hasLogicVersion
            );
            const logicNameBytes32 = toBytes32(web3, logicName);

            try {
                // Invocation
                const result = await instance.externalSetLogicName(logicNameBytes32);
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);

                const newLogicName = await instance.externalLogicName();
                if(previousLogicName !== undefined){
                    const previousLogicNameBytes32 = toBytes32(web3, previousLogicName);
                    assert.equal(newLogicName, previousLogicNameBytes32);
                } else {
                    assert.equal(newLogicName, logicNameBytes32);
                }
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});