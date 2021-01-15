// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS } = require('../utils/consts');
const { lendingPool } = require('../utils/events');
const MintableInterfaceEncoder = require('../utils/encoders/MintableInterfaceEncoder');
const CompoundInterfaceEncoder = require('../utils/encoders/CompoundInterfaceEncoder');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');
const CTokenInterfaceEncoder = require('../utils/encoders/CTokenInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const DAIMock = artifacts.require('./mock/token/DAIMock.sol');

// Smart contracts
const Lenders = artifacts.require('./base/Lenders.sol');
const LendingPool = artifacts.require('./base/LendingPool.sol');
const TToken = artifacts.require('./base/TToken.sol');

contract('LendingPoolDepositTest', function (accounts) {
  const mintableInterfaceEncoder = new MintableInterfaceEncoder(web3);
  const compoundInterfaceEncoder = new CompoundInterfaceEncoder(web3);
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);
  const cTokenEncoder = new CTokenInterfaceEncoder(web3);

  let instance;
  let tTokenInstance;
  let daiInstance;
  let lendersInstance;
  let loansInstance;
  let interestConsensusInstance;
  let cTokenInstance;
  let settingsInstance;

  beforeEach('Setup for each test', async () => {
    tTokenInstance = await Mock.new();
    daiInstance = await DAIMock.new();
    loansInstance = await Mock.new();
    interestConsensusInstance = await Mock.new();
    instance = await LendingPool.new();
    settingsInstance = await Mock.new();

    cTokenInstance = await Mock.new();
    await cTokenInstance.givenMethodReturnAddress(
      cTokenEncoder.encodeUnderlying(),
      daiInstance.address
    );

    lendersInstance = await Lenders.new();
    await lendersInstance.initialize(
      tTokenInstance.address,
      instance.address,
      interestConsensusInstance.address,
      settingsInstance.address
    );

    await instance.initialize(
      tTokenInstance.address,
      daiInstance.address,
      lendersInstance.address,
      loansInstance.address,
      settingsInstance.address
    );
  });

  withData(
    {
      _1_basic: [accounts[0], true, true, 1, false, 1000, undefined, false],
      _2_notTransferFromEnoughBalance: [
        accounts[2],
        false,
        true,
        100,
        false,
        1000,
        'SafeERC20: ERC20 operation did not succeed',
        true,
      ],
      _3_notDepositIntoCompound: [
        accounts[2],
        true,
        true,
        100,
        true,
        1000,
        'COMPOUND_DEPOSIT_ERROR',
        true,
      ],
      _4_notMint: [accounts[0], true, false, 60, false, 1000, 'TTOKEN_MINT_FAILED', true],
      _5_notAllowance: [
        accounts[0],
        true,
        true,
        1,
        false,
        0,
        'LEND_TOKEN_NOT_ENOUGH_ALLOWANCE',
        true,
      ],
    },
    function (
      recipient,
      transferFrom,
      mint,
      amountToDeposit,
      compoundFails,
      allowance,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t('user', 'deposit', 'Should able (or not) to deposit DAIs.', mustFail),
        async function () {
          // Setup
          await settingsInstance.givenMethodReturnAddress(
            settingsInterfaceEncoder.encodeGetCTokenAddress(),
            cTokenInstance.address
          );
          if (!transferFrom) {
            await daiInstance.mockTransferFromReturnFalse();
          }
          const encodeMint = mintableInterfaceEncoder.encodeMint();
          await tTokenInstance.givenMethodReturnBool(encodeMint, mint);
          const mintResponse = compoundFails ? 1 : 0;
          const encodeCompMint = compoundInterfaceEncoder.encodeMint();
          await cTokenInstance.givenMethodReturnUint(encodeCompMint, mintResponse);

          await daiInstance.mint(recipient, allowance);
          await daiInstance.approve(instance.address, allowance, { from: recipient });

          try {
            // Invocation
            const result = await instance.deposit(amountToDeposit, {
              from: recipient,
            });

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
            lendingPool.tokenDeposited(result).emitted(recipient, amountToDeposit);
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

  withData(
    {
      _1_TTokenNoMinter: [
        accounts[0],
        true,
        60,
        false,
        1000,
        'MinterRole: caller does not have the Minter role',
        true,
      ],
    },
    function (
      recipient,
      transferFrom,
      amountToDeposit,
      compoundFails,
      allowance,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t('user', 'deposit', 'Should able (or not) to deposit DAIs.', mustFail),
        async function () {
          // Setup
          // Overriding instances created during beforeEach() as a real TToken instance
          // is needed for this test.
          tTokenInstance = await TToken.new(
            settingsInstance.address,
            'TToken Name',
            'TTN',
            0
          );
          lendersInstance = await Lenders.new();

          await lendersInstance.initialize(
            tTokenInstance.address,
            instance.address,
            interestConsensusInstance.address,
            settingsInstance.address
          );
          instance = await LendingPool.new();
          await instance.initialize(
            tTokenInstance.address,
            daiInstance.address,
            lendersInstance.address,
            loansInstance.address,
            settingsInstance.address
          );

          if (!transferFrom) {
            await daiInstance.mockTransferFromReturnFalse();
          }
          const mintResponse = compoundFails ? 1 : 0;
          const encodeCompMint = compoundInterfaceEncoder.encodeMint();
          await cTokenInstance.givenMethodReturnUint(encodeCompMint, mintResponse);
          await daiInstance.mint(recipient, allowance);
          await daiInstance.approve(instance.address, allowance, { from: recipient });

          try {
            // Invocation
            const result = await instance.deposit(amountToDeposit, {
              from: recipient,
            });

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail);
            assert(error);
            // Making sure LendingPool contract is not a TToken minter
            assert.isFalse(
              await tTokenInstance.isMinter(instance.address),
              'LendingPool should not be minter in this test.'
            );
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
