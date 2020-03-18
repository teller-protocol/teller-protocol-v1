// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('./utils/consts');

// Mock contracts
const TokenMock = artifacts.require("./mock/token/SimpleToken.sol");
const DAOMock = artifacts.require("./mock/util/Mock.sol");
const ZDai = artifacts.require("./ZDai.sol");

// Smart contracts
const ZeroCollateralMain = artifacts.require("./ZeroCollateralMain.sol");

contract('ZeroCollateralConstructorTest', function (accounts) {
    const owner = accounts[0];
    let daiInstance;
    let zdaiInstance;
    let daoInstance;
    let estimatedGas;
    
    beforeEach('Setup for each test', async () => {
        zdaiInstance = await ZDai.new(
            'Zero Collateral Unit',
            'ZCU',
            18
        );
        assert(zdaiInstance);
        assert(zdaiInstance.address);

        daiInstance = await TokenMock.new();
        assert(daiInstance);
        assert(daiInstance.address);

        daoInstance = await DAOMock.new();
        assert(daoInstance);
        assert(daoInstance.address);

        const params = [
            daiInstance.address,
            zdaiInstance.address,
            daoInstance.address,
        ];
        estimatedGas = await ZeroCollateralMain.new.estimateGas(...params);
    });

    withData({
        _1_basic: [true, true, true, undefined, false],
        _2_daiAddress_empty: [false, true, true, 'Dai address is required.', true],
        _3_zdaiAddress_empty: [true, false, true, 'ZDai address is required.', true],
        _4_zcdaoAddress_empty: [true, true, false, 'ZCDao address is required.', true]
    }, function(
        createDaiInstance,
        createZdaiInstance,
        createDaoInstance,
        expectedErrorMessage,
        mustFail
    ) {    
        it(t('user', 'new', 'Should (or not) be able to create a new instance.', mustFail), async function() {
            // Setup
            const daiAddress = createDaiInstance ? daiInstance.address : NULL_ADDRESS;
            const zDaiAddress = createZdaiInstance ? zdaiInstance.address : NULL_ADDRESS;
            const daoAddress = createDaoInstance ? daoInstance.address : NULL_ADDRESS;

            try {
                // Invocation
                const result = await ZeroCollateralMain.new(
                    daiAddress,
                    zDaiAddress,
                    daoAddress,
                    {
                        from: owner,
                        gas: estimatedGas.toString()
                    }
                );
                
                // Assertions
                assert(!mustFail, 'It should have failed because data is invalid.');
                assert(result);
                assert(result.address);
            } catch (error) {
                // Assertions
                assert(mustFail);
                assert(error);
                assert.equal(error.reason, expectedErrorMessage);
            }
        });
    });
});