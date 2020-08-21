// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, createMocks } = require("../utils/consts");
const { atmFactory } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMFactory = artifacts.require("./atm/ATMFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMFactorySetATMTokenTemplateTest", function (accounts) {
    const ADMIN_INDEX = 0;
    let admin;
    let instance;
    let initialSettingsAddress;
    let mocks;

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

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [0, 2, undefined, false],
        _2_not_contract: [0, 99, "ATM_TOKEN_MUST_BE_A_CONTRACT", true],
        _3_not_empty: [0, -1, "ATM_TOKEN_MUST_BE_A_CONTRACT", true],
        _4_same_old: [0, 100, "NEW_ATM_TOKEN_MUST_BE_PROVIDED", true],
        _5_not_owner: [1, 2, 'SENDER_ISNT_ALLOWED', true],
    }, function(
        senderIndex,
        atmTokenTemplateIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "setATMTokenTemplate", "Should be able (or not) to set atm token template", mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const oldATMTokenTemplate = await Mock.new();
            await instance.setATMTokenTemplate(oldATMTokenTemplate.address, { from: admin });
            const atmTokenTemplateAddress = atmTokenTemplateIndex === 100 ? oldATMTokenTemplate.address : getInstance(mocks, atmTokenTemplateIndex, 2);

            try {
                // Invocation
                const result = await instance.setATMTokenTemplate(atmTokenTemplateAddress, { from: sender });
                
                // Assertions
                assert(!mustFail, "It should have failed because data is invalid.");
                assert(result);

                // Validating state changes
                const newATMTokenTemplate = await instance.atmTokenTemplate();
                assert.equal(
                    newATMTokenTemplate,
                    atmTokenTemplateAddress,
                    "ATM Token Template was not updated."
                );

                // Validating events were emitted
                atmFactory
                    .atmTokenTemplateUpdated(result)
                    .emitted(sender, oldATMTokenTemplate.address, newATMTokenTemplate);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});