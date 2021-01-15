// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require('Mock');
const DAIMock = artifacts.require('DAIMock');
const CERC20Mock = artifacts.require('CERC20Mock');

// Smart contracts
const Lenders = artifacts.require('Lenders');
const LendingPool = artifacts.require('LendingPoolMock');

contract('LendingPoolRepayTest', function (accounts) {
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);

  let instance;
  let tTokenInstance;
  let daiInstance;
  let lendersInstance;
  let interestConsensusInstance;
  let cTokenInstance;
  let settingsInstance;
  let loansInstance;

  beforeEach('Setup for each test', async () => {
    tTokenInstance = await Mock.new();
    daiInstance = await DAIMock.new();
    instance = await LendingPool.new();
    interestConsensusInstance = await Mock.new();
    cTokenInstance = await CERC20Mock.new('CDAI', 'CDAI', 8, daiInstance.address, 1);
    settingsInstance = await Mock.new();
    loansInstance = await Mock.new();

    lendersInstance = await Lenders.new();
    await lendersInstance.initialize(
      tTokenInstance.address,
      instance.address,
      interestConsensusInstance.address,
      settingsInstance.address
    );
  });

  withData(
    {
      _1_cTokenSupported_basic: [
        accounts[1],
        true,
        true,
        true,
        10,
        5,
        1000,
        undefined,
        false,
      ],
      _2_cTokenSupported_notLoan: [
        accounts[1],
        true,
        false,
        true,
        10,
        5,
        1000,
        'ADDRESS_ISNT_LOANS_CONTRACT',
        true,
      ],
      _3_cTokenSupported_transferFail: [
        accounts[1],
        true,
        true,
        false,
        200,
        5,
        1000,
        'SafeERC20: ERC20 operation did not succeed',
        true,
      ],
      _4_cTokenSupported_compoundFail: [
        accounts[1],
        true,
        true,
        true,
        77777777,
        0,
        77777777,
        'COMPOUND_DEPOSIT_ERROR',
        true,
      ],
      _6_cTokenNotSupported_basic: [
        accounts[1],
        false,
        true,
        true,
        10,
        5,
        1000,
        undefined,
        false,
      ],
      _7_cTokenNotSupported_notLoan: [
        accounts[1],
        false,
        false,
        true,
        10,
        5,
        1000,
        'ADDRESS_ISNT_LOANS_CONTRACT',
        true,
      ],
      _8_cTokenNotSupported_transferFail: [
        accounts[1],
        false,
        true,
        false,
        200,
        5,
        1000,
        'SafeERC20: ERC20 operation did not succeed',
        true,
      ],
      _9_cTokenNotSupported_allowanceFail: [
        accounts[1],
        false,
        true,
        true,
        10,
        5,
        0,
        'LEND_TOKEN_NOT_ENOUGH_ALLOWANCE',
        true,
      ],
    },
    function (
      borrower,
      isCTokenSupported,
      mockRequireIsLoan,
      transferFrom,
      principalToRepay,
      interestToRepay,
      allowance,
      expectedErrorMessage,
      mustFail
    ) {
      const approvedAmount = allowance;
      it(
        t('user', 'repay', 'Should able (or not) to repay loan.', mustFail),
        async function () {
          const totalToRepay = principalToRepay + interestToRepay;
          // Setup
          const sender = accounts[1];
          if (isCTokenSupported) {
            await settingsInstance.givenMethodReturnAddress(
              settingsInterfaceEncoder.encodeGetCTokenAddress(),
              cTokenInstance.address
            );
          }
          await instance.mockRequireIsLoan(mockRequireIsLoan);
          await instance.initialize(
            tTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansInstance.address,
            settingsInstance.address
          );

          await daiInstance.mint(sender, totalToRepay);
          await daiInstance.approve(instance.address, approvedAmount, { from: sender });
          if (!transferFrom) {
            await daiInstance.mockTransferFromReturnFalse();
          }

          try {
            // Invocation
            const result = await instance.repay(
              principalToRepay,
              interestToRepay,
              borrower,
              { from: sender }
            );
            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            lendingPool.tokenRepaid(result).emitted(borrower, totalToRepay);
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage, error.message);
          }
        }
      );
    }
  );
});
