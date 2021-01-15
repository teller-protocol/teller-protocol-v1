// JS Libraries
const withData = require('leche').withData;
const { t } = require('../utils/consts');
const SettingsInterfaceEncoder = require('../utils/encoders/SettingsInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');
const CERC20Mock = artifacts.require('./mock/providers/compound/CERC20Mock.sol');
const ERC20Mock = artifacts.require('./mock/token/ERC20Mock.sol');

// Smart contracts
const LendingPool = artifacts.require('LendingPoolMock.sol');

contract('LendingPoolGetMarketStateTest', function (accounts) {
  const settingsInterfaceEncoder = new SettingsInterfaceEncoder(web3);

  let instance;
  let settings;
  let cTokenInstance;

  beforeEach('Setup for each test', async () => {
    const underlyingTokenInstance = await ERC20Mock.new('', '', 8, 10000);
    cTokenInstance = await CERC20Mock.new('', '', 8, underlyingTokenInstance.address, 1);
    await cTokenInstance.setMockExchangeRate('1' + '0'.repeat(18));

    settings = await Mock.new();
    await settings.givenMethodReturnAddress(
      settingsInterfaceEncoder.encodeGetCTokenAddress(),
      cTokenInstance.address
    );

    instance = await LendingPool.new();
    await instance.initialize(
      (await Mock.new()).address,
      (await Mock.new()).address,
      (await Mock.new()).address,
      (await Mock.new()).address,
      settings.address
    );
  });

  withData(
    {
      _1_no_compound: {
        marketState: {
          totalSupplied: 1000,
          totalRepaid: 100,
          totalBorrowed: 500,
        },
        compoundMarketState: {
          totalSupplied: 0,
          totalRepaid: 0,
          totalBorrowed: 0,
        },
        expectedMarketState: {
          totalSupplied: 1000,
          totalRepaid: 100,
          totalBorrowed: 500,
        },
      },
      _2_only_compound: {
        marketState: {
          totalSupplied: 0,
          totalRepaid: 0,
          totalBorrowed: 0,
        },
        compoundMarketState: {
          totalSupplied: 1000,
          totalRepaid: 100,
          totalBorrowed: 500,
        },
        expectedMarketState: {
          totalSupplied: 1000,
          totalRepaid: 100,
          totalBorrowed: 500,
        },
      },
      _3_mix: {
        marketState: {
          totalSupplied: 1000,
          totalRepaid: 100,
          totalBorrowed: 500,
        },
        compoundMarketState: {
          totalSupplied: 1000,
          totalRepaid: 100,
          totalBorrowed: 500,
        },
        expectedMarketState: {
          totalSupplied: 2000,
          totalRepaid: 200,
          totalBorrowed: 1000,
        },
      },
    },
    function ({ marketState, compoundMarketState, expectedMarketState }) {
      it(
        t(
          'user',
          'getMarketState',
          'Should be able to get the current market info.',
          false
        ),
        async function () {
          // Setup
          await instance.mockMarketState(
            marketState.totalSupplied,
            marketState.totalRepaid,
            marketState.totalBorrowed
          );
          await instance.mockCompoundMarketState(
            compoundMarketState.totalSupplied,
            compoundMarketState.totalRepaid,
            compoundMarketState.totalBorrowed
          );

          // Invocation
          const result = await instance.getMarketState();

          // Assertions
          assert.equal(
            result.totalSupplied.toString(),
            expectedMarketState.totalSupplied.toString(),
            'Invalid totalSupplied'
          );
          assert.equal(
            result.totalRepaid.toString(),
            expectedMarketState.totalRepaid.toString(),
            'Invalid totalRepaid'
          );
          assert.equal(
            result.totalBorrowed.toString(),
            expectedMarketState.totalBorrowed.toString(),
            'Invalid totalBorrowed'
          );
        }
      );
    }
  );
});
