// JS Libraries
const { createLoanTerms } = require("../utils/structs");
const withData = require("leche").withData;
const { t, NULL_ADDRESS, ACTIVE } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");

// Smart contracts
const EscrowProxy = artifacts.require("./base/EscrowProxy.sol");
const Settings = artifacts.require("./base/Settings.sol");
const EscrowFactory = artifacts.require("./base/EscrowFactory.sol");
const EscrowMock = artifacts.require("./mock/base/EscrowMock.sol");
const Loans = artifacts.require("./mock/base/EtherCollateralLoansMock.sol");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

contract("EscrowProxyImplementationTest", function(accounts) {
    const owner = accounts[0];
    let libraryV1
    let libraryV2
    let factory
    let settings
    let loans
    const mockLoanID = 1234

    beforeEach(async () => {
        libraryV1 = await Mock.new();
        libraryV2 = await EscrowMock.new();

        settings = await createTestSettingsInstance(Settings, { from: owner, Mock });
        factory = await EscrowFactory.new();
        loans = await Loans.new();

        await factory.initialize(settings.address, libraryV1.address)
        await settings.setEscrowFactory(factory.address);
        await loans.externalSetSettings(settings.address);
    });

    withData({
        _1_implementation_function_multiply: [ 7, 5, 3, false, null ],
    }, function(borrowerIndex, num1, num2, mustFail, expectedErrorMessage) {
        it(t("user", "implementation", "Should be able to use the current implementation address from the factory.", mustFail), async function() {
            // Setup
            const borrower = borrowerIndex === -1 ? NULL_ADDRESS : accounts[borrowerIndex];
            const loanTerms = createLoanTerms(borrower, NULL_ADDRESS, 0, 0, 0, 0);
            await loans.setLoan(mockLoanID, loanTerms, 0, 0, 123456, 0, 0, 0, loanTerms.maxLoanAmount, ACTIVE, false);

            const result = await loans.externalCreateEscrow(mockLoanID)
            const receipt = await web3.eth.getTransactionReceipt(result.tx)
            const events = await EscrowFactory.decodeLogs(receipt.logs)
            const proxy = await EscrowProxy.at(events[0].args.escrowAddress)
            const escrow = await EscrowMock.at(events[0].args.escrowAddress)

            async function testFunction() {
                const expectedValue = num1 * num2;
                const value = await escrow.testImplementationFunctionMultiply.call(num1, num2);
                assert(value.toString(), expectedValue.toString(), "Incorrect response from implementation.")

                return true
            }

            try {
                // Invocation
                const proxyImplementationV1 = await proxy.implementation.call()
                assert.equal(libraryV1.address, proxyImplementationV1)

                let v1Success
                try {
                    v1Success = await testFunction()
                } catch (err) {
                    v1Success = false
                }
                assert(!v1Success, 'Should NOT have been able to call function on v1 implementation.')

                await factory.upgradeEscrowLogic(libraryV2.address)
                const proxyImplementationV2 = await proxy.implementation.call()
                assert.equal(libraryV2.address, proxyImplementationV2)

                const v2Success = await testFunction()
                assert(v2Success, 'Should have been able to call function on v2 implementation.')
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});
