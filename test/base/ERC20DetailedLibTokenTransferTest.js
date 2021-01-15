// JS Libraries
const withData = require('leche').withData;
const { t, toDecimals } = require('../utils/consts');
const ERC20InterfaceEncoder = require('../utils/encoders/ERC20InterfaceEncoder');
const BigNumber = require('bignumber.js');

// Smart contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const DAI = artifacts.require('./mock/token/DAIMock.sol');
const ERC20DetailedLibMock = artifacts.require('./mock/util/ERC20DetailedLibMock.sol');

contract('ERC20DetailedLibTokenTransferTest', function (accounts) {
  const erc20InterfaceEncoder = new ERC20InterfaceEncoder(web3);
  let instance;

  beforeEach('Setup for each test', async () => {
    instance = await ERC20DetailedLibMock.new();
  });

  withData(
    {
      _1_basic: [1000, 2, 500, undefined, false],
      _2_all: [1500, 1, 1500, undefined, false],
      _3_not_enough_balance_1: [700, 4, 2000, 'NOT_ENOUGH_TOKENS_BALANCE', true],
      _4_not_enough_balance_2: [1600, 3, 1601, 'NOT_ENOUGH_TOKENS_BALANCE', true],
    },
    function (initialBalance, recipientIndex, amount, expectedErrorMessage, mustFail) {
      it(
        t('user', 'tokenTransfer', 'Should able (or not) to transfer tokens.', mustFail),
        async function () {
          // Setup
          const token = await DAI.new();
          const recipient = accounts[recipientIndex];
          const tokenDecimals = await token.decimals();
          const amountWithDecimals = toDecimals(amount, tokenDecimals);
          const initialBalanceWithDecimals = toDecimals(initialBalance, tokenDecimals);
          await token.mint(instance.address, initialBalanceWithDecimals);

          try {
            // Invocation
            const result = await instance.tokenTransfer(
              token.address,
              recipient,
              amountWithDecimals
            );

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
            const finalBalanceWithDecimals = await token.balanceOf(instance.address);

            assert.equal(
              BigNumber(initialBalanceWithDecimals.toString())
                .minus(finalBalanceWithDecimals.toString())
                .toFixed(0),
              amountWithDecimals.toFixed(0)
            );
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );

  withData(
    {
      _1_not_enough_balance: [1000, true, 2, 1001, 'NOT_ENOUGH_TOKENS_BALANCE', true],
      _2_transfer_fail: [1000, false, 3, 1000, 'TOKENS_TRANSFER_FAILED', true],
      _3_invalid_final_balance: [1000, true, 4, 1000, 'INV_BALANCE_AFTER_TRANSFER', true],
    },
    function (
      initialBalance,
      transferResponse,
      recipientIndex,
      amount,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t(
          'user',
          'tokenTransfer#2',
          'Should able (or not) to transfer tokens.',
          mustFail
        ),
        async function () {
          // Setup
          const token = await Mock.new();
          const recipient = accounts[recipientIndex];
          const amountWithDecimals = toDecimals(amount, 18);
          const initialBalanceWithDecimals = toDecimals(initialBalance, 18);

          await token.givenMethodReturnUint(
            erc20InterfaceEncoder.encodeBalanceOf(),
            initialBalanceWithDecimals
          );
          await token.givenMethodReturnBool(
            erc20InterfaceEncoder.encodeTransfer(),
            transferResponse
          );

          try {
            // Invocation
            const result = await instance.tokenTransfer(
              token.address,
              recipient,
              amountWithDecimals
            );

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
