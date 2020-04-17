// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lenders } = require('../utils/events');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Lenders = artifacts.require("./mock/base/LendersMock.sol");

contract('LendersUpdateAccruedInterestForTest', function (accounts) {
    let instance;
    let zTokenInstance;
    let lendingPoolInstance;
    const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
    
    beforeEach('Setup for each test', async () => {
        zTokenInstance = await Mock.new();
        lendingPoolInstance = await Mock.new();
        instance = await Lenders.new(
            zTokenInstance.address,
            lendingPoolInstance.address,
        );
    });

    withData({
        _1_0Interest_2blocks_5balance: [accounts[0], 0, 98, 100, 5, 10],
        _2_14Interest_0blocks_10balance: [accounts[1], 14, 100, 100, 10, 14],
        _3_0Interest_0blocks_2000balance: [accounts[2], 0, 100, 100, 2000, 0],
        _4_78Interest_200blocks_250balance: [accounts[3], 78, 120, 320, 250, 50078],
    }, function(
        lenderAddress,
        currentAccruedInterest,
        previousBlockAccruedInterest,
        currentBlockNumber,
        currentZTokenBalance,
        newAccruedInterestExpected,
    ) {    
        it(t('user', 'updateAccruedInterestFor', 'Should able to update the accrued interest.', false), async function() {
            // Setup
            await instance.setCurrentBlockNumber(currentBlockNumber.toString());
            await instance.mockLenderInfo(
                lenderAddress,
                previousBlockAccruedInterest.toString(),
                currentAccruedInterest.toString()
            );
            await zTokenInstance.givenMethodReturnUint(
                erc20InterfaceEncoder.encodeBalanceOf(),
                currentZTokenBalance.toString()
            );

            // Invocation
            const result = await instance.externalUpdateAccruedInterestFor(lenderAddress);

            // Assertions
            assert(result);
            lenders
                .accruedInterestUpdated(result)
                .emitted(lenderAddress, currentBlockNumber, newAccruedInterestExpected);
            const lenderAccountResult = await instance.lenderAccounts(lenderAddress);
            assert.equal(lenderAccountResult.lastBlockAccrued.toString(), currentBlockNumber.toString());
            assert.equal(lenderAccountResult.totalAccruedInterest.toString(), newAccruedInterestExpected.toString());
        });
    });
});