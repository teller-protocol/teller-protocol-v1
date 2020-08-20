// JS Libraries
const { upgradeable } = require("../utils/events");
const withData = require("leche").withData;
const { t } = require("../utils/consts");

// Smart contracts
const UpgradeableProxy = artifacts.require("./base/UpgradeableProxy.sol");
const UpgradableV1 = artifacts.require("./mock/upgradable/UpgradableV1.sol");
const UpgradableV2 = artifacts.require("./mock/upgradable/UpgradableV2.sol");

const DAI = artifacts.require("./mock/token/DAIMock.sol");

contract("UpgradeableProxyUpgradeToTest", function(accounts) {
    let dai;
    let v1LibraryInstance;
    let v2LibraryInstance;
    let v1InitData;
    let initValue = 43;

    before(async () => {
        dai = await DAI.new()
    })

    beforeEach("Setup for each test", async () => {
        v1LibraryInstance = await UpgradableV1.new();
        v2LibraryInstance = await UpgradableV2.new();

        v1InitData = v1LibraryInstance.contract.methods.initialize(initValue).encodeABI();
    });

    withData({
        _1_only_admin_upgrade: [ accounts[1], accounts[0], false, true, "UPGRADABLE_CALLER_MUST_BE_ADMIN" ],
        _2_successful: [ accounts[0], accounts[0], false, false, null ],
        _3_initialize_after_constructor: [ accounts[0], accounts[0], true, false, null ]
    }, function(caller, admin, initAfter, mustFail, expectedErrorMessage) {
        it(t("admin", "upgradeTo", "Should be able to (or not) upgrade the functionality of a contract.", mustFail), async function() {
            try {
                // Setup
                const initData = initAfter ? "0x" : v1InitData;
                const proxy = await UpgradeableProxy.new(v1LibraryInstance.address, admin, initData);
                const v1 = await UpgradableV1.at(proxy.address);
                const v2 = await UpgradableV2.at(proxy.address);

                // Invocation
                if (initAfter) {
                    await v1.initialize(initValue);
                }

                const implementationV1 = await proxy.implementation.call();
                assert.equal(implementationV1.toLowerCase(), v1LibraryInstance.address.toLowerCase(), "V1 implementation addresses do not match");

                const v1Value = await v1.value.call();
                assert.equal(initValue.toString(), v1Value.toString(), "Initial values do not match");

                const result = await proxy.upgradeTo(v2LibraryInstance.address, { from: caller });
                const implementationV2 = await proxy.implementation.call();
                assert.equal(implementationV2.toLowerCase(), v2LibraryInstance.address.toLowerCase(), "V2 implementation addresses do not match");

                const newValue = 1234;
                await v2.setValue(newValue);

                const updatedValue = await v1.value.call();
                assert.equal(updatedValue.toString(), newValue.toString(), "Updated values do not match");

                upgradeable
                    .upgraded(result)
                    .emitted(v2LibraryInstance.address);
            } catch (error) {
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });

    withData({
        _1_eth: [ accounts[0], true, 100, 20, accounts[2] ],
        _2_dai: [ accounts[0], false, 100, 20, accounts[2] ],
    }, function(admin, ethORtoken, balance, incrementsToSend, recipient) {
        it(t("proxy", "balance", "Should be able to keep it's ETH and token balance even after an upgrade.", false), async function() {
            // Setup
            const proxy = await UpgradeableProxy.new(v1LibraryInstance.address, admin, v1InitData);
            const v1 = await UpgradableV1.at(proxy.address);
            const v2 = await UpgradableV2.at(proxy.address);

            async function getBalance(address) {
                const balance = ethORtoken
                    ? await web3.eth.getBalance(address)
                    : await dai.balanceOf(address)
                return Number(balance.toString())
            }
            async function verifyBalance(address, _balance, message) {
                const balance = await getBalance(address)
                assert.equal(balance.toString(), _balance.toString(), message)
            }
            async function send(version, from) {
            }

            // Invocation
            await verifyBalance(v1.address, 0, 'Initial proxy  balance should be 0')

            if (ethORtoken) {
                await web3.eth.sendTransaction({ from: accounts[0], to: v1.address, value: balance })
            } else {
                await dai.mint(v1.address, balance)
            }

            await verifyBalance(v1.address, balance, 'Proxy contract balance was not set.')
            ethORtoken
                ? await v1.sendETH(recipient, incrementsToSend)
                : await v1.sendToken(dai.address, recipient, incrementsToSend)
            await verifyBalance(v1.address, balance - incrementsToSend, 'Did not send amount required from v1.')

            await proxy.upgradeTo(v2LibraryInstance.address, { from: admin });
            const implementationV2 = await proxy.implementation.call();
            assert.equal(implementationV2, v2LibraryInstance.address, "V2 implementation addresses do not match");

            const v2Sender = accounts[6]
            let v2SenderBeforeBalance = await getBalance(v2Sender)
            await verifyBalance(v2.address, balance - incrementsToSend, 'Balances do not match after upgrade.')
            const resultV2 = ethORtoken
                ? await v2.sendETHToSender(incrementsToSend, { from: v2Sender })
                : await v2.sendTokenToSender(dai.address, incrementsToSend, { from: v2Sender })
            if (ethORtoken) {
                const tx = await web3.eth.getTransaction(resultV2.tx);
                const gasCost = Number(tx.gasPrice) * resultV2.receipt.gasUsed;
                v2SenderBeforeBalance -= Number(gasCost.toString())
            }
            await verifyBalance(v2.address, balance - incrementsToSend - incrementsToSend, 'Did not send amount required from v2.')
            await verifyBalance(v2Sender, v2SenderBeforeBalance + Number(incrementsToSend), 'Sender did not receive balance from v2.')
        });
    });
});
