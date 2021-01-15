// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lenders } = require('../utils/events');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Lenders = artifacts.require('./mock/base/LendersMock.sol');

contract('LendersWithdrawInterestTest', function (accounts) {
  let instance;
  let tTokenInstance;
  let lendingPoolInstance;
  let interestConsensusInstance;
  let settingsInstance;
  let marketsInstance;

  beforeEach('Setup for each test', async () => {
    tTokenInstance = await Mock.new();
    lendingPoolInstance = await Mock.new();
    interestConsensusInstance = await Mock.new();
    settingsInstance = await Mock.new();
    marketsInstance = await Mock.new();
    instance = await Lenders.new();
    await instance.initialize(
      tTokenInstance.address,
      lendingPoolInstance.address,
      interestConsensusInstance.address,
      settingsInstance.address
    );
  });

  withData(
    {
      _1_0Available_10Requested: [
        true,
        accounts[0],
        10,
        0,
        100,
        4,
        0,
        0,
        'AMOUNT_EXCEEDS_AVAILABLE_AMOUNT',
        true,
      ],
      _2_50Available_10Requested: [
        true,
        accounts[1],
        10,
        50,
        100,
        3,
        10,
        40,
        undefined,
        false,
      ],
      _3_50Available_100Requested: [
        true,
        accounts[2],
        100,
        50,
        100,
        20,
        50,
        0,
        'AMOUNT_EXCEEDS_AVAILABLE_AMOUNT',
        true,
      ],
      _5_50Available_0Requested: [
        true,
        accounts[0],
        0,
        50,
        100,
        4,
        0,
        50,
        'CANNOT_WITHDRAW_ZERO',
        true,
      ],
      _6_50Available_0Requested_noPermissions: [
        false,
        accounts[0],
        0,
        50,
        100,
        4,
        0,
        50,
        'SENDER_ISNT_LENDING_POOL',
        true,
      ],
    },
    function (
      areAddressesEquals,
      lenderAddress,
      amountToWithdraw,
      totalNotWithdrawn,
      totalAccruedInterest,
      timeLastAccrued,
      amountWithdrawnExpected,
      newTotalNotWithdrawn,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t('user', 'withdrawInterest', 'Should able to withdraw interest.', false),
        async function () {
          // Setup
          await instance.mockLenderInfo(
            lenderAddress,
            timeLastAccrued.toString(),
            totalNotWithdrawn.toString(),
            totalAccruedInterest.toString()
          );
          await instance.mockAddressesEqual(areAddressesEquals);

          try {
            // Invocation
            const result = await instance.withdrawInterest(
              lenderAddress,
              amountToWithdraw
            );

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
            if (amountWithdrawnExpected != 0) {
              lenders
                .accruedInterestWithdrawn(result)
                .emitted(lenderAddress, amountWithdrawnExpected);
            }

            const lenderAccruedInterest = await instance.accruedInterest(lenderAddress);
            assert.equal(
              lenderAccruedInterest.totalNotWithdrawn.toString(),
              newTotalNotWithdrawn.toString()
            );
            assert.equal(
              lenderAccruedInterest.timeLastAccrued.toString(),
              timeLastAccrued.toString()
            );
            assert.equal(
              lenderAccruedInterest.totalAccruedInterest.toString(),
              totalAccruedInterest.toString()
            );
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
