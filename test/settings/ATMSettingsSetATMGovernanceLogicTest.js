// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, createMocks } = require("../utils/consts");
const { atmFactory } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMSettingsSetATMGovernanceLogicTest", function (accounts) {
    const ADMIN_INDEX = 0;
    let admin;
    let instance;
    let oldATMGovernanceLogicAddress;
    let atmGovernanceLogicIndex = 1;
    let mocks;

    beforeEach("Setup for each test", async () => {
        mocks = await createMocks(Mock, 10);
        admin = accounts[ADMIN_INDEX];
        const settings = await Settings.new();
        await settings.initialize(admin);
        const tlrTokenLogic = await Mock.new();
        oldATMGovernanceLogicAddress = mocks[atmGovernanceLogicIndex];
        instance = await ATMSettings.new(
            settings.address,
            tlrTokenLogic.address,
            oldATMGovernanceLogicAddress,
        );
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [0, atmGovernanceLogicIndex + 1, undefined, false],
        _2_not_contract: [0, 99, "ATM_GOV_MUST_BE_A_CONTRACT", true],
        _3_same_old: [0, atmGovernanceLogicIndex, "NEW_ATM_GOV_MUST_BE_PROVIDED", true],
        _4_not_pauser: [ADMIN_INDEX + 1, atmGovernanceLogicIndex + 1, 'ONLY_PAUSER', true],
    }, function(
        senderIndex,
        newAtmGovernanceLogicIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "setATMGovernanceLogic", "Should be able (or not) to set atm governance logic", mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const atmGovernanceLogicAddress = getInstance(mocks, newAtmGovernanceLogicIndex, 2);

            try {
                // Invocation
                const result = await instance.setATMGovernanceLogic(atmGovernanceLogicAddress, { from: sender });
                
                // Assertions
                assert(!mustFail, "It should have failed because data is invalid.");
                assert(result);

                // Validating state changes
                const newATMGovernanceLogic = await instance.atmGovernanceLogic();
                assert.equal(
                    newATMGovernanceLogic,
                    atmGovernanceLogicAddress,
                    "ATM Governance Template was not updated."
                );

                // Validating events were emitted
                atmFactory
                    .atmGovernanceLogicUpdated(result)
                    .emitted(sender, oldATMGovernanceLogicAddress, newATMGovernanceLogic);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});