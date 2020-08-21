// JS Libraries
const withData = require("leche").withData;
const { t } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");

// Smart contracts
const UpgradeableEscrowProxy = artifacts.require("./base/UpgradeableEscrowProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const EscrowMock = artifacts.require("./mock/base/EscrowMock.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

contract("UpgradeableEscrowProxyTest", function(accounts) {
    let libraryV1
    let libraryV2
    let factory
    let settings
    let loans
    const mockLoanID = 1234

    beforeEach(async () => {
        libraryV1 = await Mock.new();
        libraryV2 = await EscrowMock.new();

        settings = await createTestSettingsInstance(Settings);
        factory = await EscrowFactory.new();
        loans = await Loans.new();

        await factory.initialize(settings.address, libraryV1.address)
        await settings.setEscrowFactory(factory.address);
        await loans.externalSetSettings(settings.address);
    });

    withData({
        _1_implementation_function_multiply: [ accounts[1], accounts[0], accounts[7], 5, 3, false, null ],
        _2_implementation_function_revert: [ accounts[1], accounts[0], accounts[7], 0, 0, true, 'IMPLEMENTATION_FUNCTION_SHOULD_REVERT' ],
    }, function(caller, admin, borrower, num1, num2, mustFail, expectedErrorMessage) {
        it(t("user", "implementation", "Should be able to use the current implementation address from the factory.", mustFail), async function() {
            try {
                // Setup
                const result = await loans.createEscrow(borrower, mockLoanID)
                const receipt = await web3.eth.getTransactionReceipt(result.tx)
                const events = await EscrowFactory.decodeLogs(receipt.logs)
                const proxy = await UpgradeableEscrowProxy.at(events[0].args.escrowAddress)
                const escrow = await EscrowMock.at(events[0].args.escrowAddress)

                // Invocation
                const proxyImplementationV1 = await proxy.implementation.call({ from: caller })
                assert.equal(libraryV1.address, proxyImplementationV1)

                await factory.upgradeEscrowLogic(libraryV2.address)
                const proxyImplementationV2 = await proxy.implementation.call({ from: caller })
                assert.equal(libraryV2.address, proxyImplementationV2)

                if (mustFail) {
                    await escrow.testImplementationFunctionRevert(expectedErrorMessage)
                } else {
                    const expectedValue = num1 * num2;
                    const value = await escrow.testImplementationFunctionMultiply.call(num1, num2);
                    assert(value.toString(), expectedValue.toString(), "Incorrect response from implementation.")
                }
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
