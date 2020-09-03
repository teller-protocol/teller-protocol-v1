// JS Libraries
const { withData } = require("leche");
const { t } = require("../utils/consts");

// Mock contracts
const DAI = artifacts.require("./mock/token/DAIMock.sol");
const USDC = artifacts.require("./mock/token/USDCMock.sol");
const LINK = artifacts.require("./mock/token/LINKMock.sol");

// Smart contracts
const BaseEscrowDapp = artifacts.require("./mock/base/BaseEscrowDappMock.sol");

contract("BaseEscrowDappTokenUpdatedTest", function(accounts) {
    let instance;
    let dai;
    let usdc;
    let link;

    beforeEach(async () => {
        instance = await BaseEscrowDapp.new();
        dai = await DAI.new();
        usdc = await USDC.new();
        link = await LINK.new();
    });

    withData({
        _1_remove_dai_remove_usdc_add_link: [100, 0, -1, 100, 0, -1, 0, 100, 0, false, null ],
        _2_remove_dai_add_usdc_remove_link: [100, 0, -1, 0, 100, 0, 100, 0, -1, false, null ],
        _3_add_dai_remove_usdc_remove_link: [0, 100, 0, 100, 0, -1, 100, 0, -1, false, null ],
        _4_add_dai_remove_usdc_add_link: [0, 100, 0, 100, 0, -1, 0, 100, 1, false, null ],
        _5_remove_dai_remove_usdc_remove_link: [100, 0, -1, 100, 0, -1, 100, 0, -1, false, null ],
        _6_add_dai_add_link: [0, 100, 1, 100, 100, 0, 0, 100, 2, false, null ],
        _7_remove_dai: [100, 0, -1, 100, 100, 1, 100, 100, 0, false, null ],
    }, function(
        initialDai,
        updateDaiBalance,
        expectedDaiIndex,
        initialUsdc,
        updateUsdcBalance,
        expectedUsdcIndex,
        initialLink,
        updateLinkBalance,
        expectedLinkIndex,
        mustFail,
        expectedErrorMessage
    ) {
        it(t("dapp", "_tokenUpdated", "Should be able to update its record of tokens that have (or not) balances.", mustFail), async function() {
            // Setup
            if (initialDai > 0) {
                await dai.mint(instance.address, initialDai)
            }
            if (initialUsdc > 0) {
                await usdc.mint(instance.address, initialUsdc)
            }
            if (initialLink > 0) {
                await link.mint(instance.address, initialLink)
            }

            try {
                // Invocation
                await instance.externalTokenUpdated(dai.address)
                await instance.externalTokenUpdated(usdc.address)
                await instance.externalTokenUpdated(link.address)

                const expectedInitialDaiIndex = initialDai ? 0 : -1
                const initialDaiIndex = await instance.findTokenIndex.call(dai.address)
                assert(initialDaiIndex.toString() === expectedInitialDaiIndex.toString(), 'Incorrect initial DAI index')

                const expectedInitialUsdcIndex = initialUsdc ? (initialDai ? 1 : 0) : -1
                const initialUsdcIndex = await instance.findTokenIndex.call(usdc.address)
                assert(initialUsdcIndex.toString() === expectedInitialUsdcIndex.toString(), 'Incorrect initial USDC index')

                const expectedInitialLinkIndex = initialLink ? (initialUsdc ? (initialDai ? 2 : 1) : (initialDai ? 1 : 0)) : -1
                const initialLinkIndex = await instance.findTokenIndex.call(link.address)
                assert(initialLinkIndex.toString() === expectedInitialLinkIndex.toString(), 'Incorrect initial LINK index')

                if (updateDaiBalance > 0) {
                    await dai.mint(instance.address, updateDaiBalance - initialDai)
                } else {
                    await instance.clearBalance(dai.address)
                }

                if (updateUsdcBalance > 0) {
                    await usdc.mint(instance.address, updateUsdcBalance - initialUsdc)
                } else {
                    await instance.clearBalance(usdc.address)
                }

                if (updateLinkBalance > 0) {
                    await link.mint(instance.address, updateLinkBalance - initialLink)
                } else {
                    await instance.clearBalance(link.address)
                }

                await instance.externalTokenUpdated(dai.address)
                await instance.externalTokenUpdated(usdc.address)
                await instance.externalTokenUpdated(link.address)

                const daiIndex = await instance.findTokenIndex.call(dai.address)
                assert(daiIndex.toString() === expectedDaiIndex.toString(), 'DAI was not updated correctly.')

                const usdcIndex = await instance.findTokenIndex.call(usdc.address)
                assert(usdcIndex.toString() === expectedUsdcIndex.toString(), 'USDC was not updated correctly.')

                const linkIndex = await instance.findTokenIndex.call(link.address)
                assert(linkIndex.toString() === expectedLinkIndex.toString(), 'LINK was not updated correctly.')
            } catch (error) {
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
                assert(mustFail, error.message);
            }
        });
    });
});
