// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, createMocks } = require("../utils/consts");
const { atmFactory } = require("../utils/events");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const ATMSettings = artifacts.require("./settings/ATMSettings.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("ATMSettingsSetATMTokenLogicTest", function (accounts) {
    const ADMIN_INDEX = 0;
    let admin;
    let instance;
    let oldTLRTokenLogicAddress;
    let tlrTokenLogicIndex = 1;
    let mocks;

    beforeEach("Setup for each test", async () => {
        mocks = await createMocks(Mock, 10);
        admin = accounts[ADMIN_INDEX];
        const settings = await Settings.new();
        await settings.initialize(admin);
        oldTLRTokenLogicAddress = mocks[tlrTokenLogicIndex];
        const atmGovernanceLogic = await Mock.new();
        instance = await ATMSettings.new(
            settings.address,
            oldTLRTokenLogicAddress,
            atmGovernanceLogic.address,
        );
    });

    const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS: index === 99 ? accounts[accountIndex] : refs[index];

    withData({
        _1_basic: [0, tlrTokenLogicIndex + 1, undefined, false],
        _2_not_contract: [0, 99, "TLR_TOKEN_MUST_BE_A_CONTRACT", true],
        _3_same_old: [0, tlrTokenLogicIndex, "NEW_ATM_TOKEN_MUST_BE_PROVIDED", true],
        _4_not_pauser: [ADMIN_INDEX + 1, tlrTokenLogicIndex + 1, 'ONLY_PAUSER', true],
    }, function(
        senderIndex,
        newTlrTokenLogicIndex,
        expectedErrorMessage,
        mustFail
    ) {
        it(t("admin", "setATMTokenLogic", "Should be able (or not) to set atm token logic", mustFail), async function() {
            // Setup
            const sender = accounts[senderIndex];
            const tlrTokenLogicAddress = await getInstance(mocks, newTlrTokenLogicIndex, 2);

            try {
                // Invocation
                const result = await instance.setTLRTokenLogic(tlrTokenLogicAddress, { from: sender });

                // Assertions
                assert(!mustFail, "It should have failed because data is invalid.");
                assert(result);

                // Validating state changes
                const newTLRTokenLogic = await instance.tlrTokenLogic();
                assert.equal(
                    newTLRTokenLogic,
                    tlrTokenLogicAddress,
                    "TLR Token Template was not updated."
                );
                
                // Validating events were emitted
                atmFactory
                    .tlrTokenLogicUpdated(result)
                    .emitted(sender, oldTLRTokenLogicAddress, newTLRTokenLogic);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
