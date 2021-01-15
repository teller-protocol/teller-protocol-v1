// JS Libraries
const withData = require('leche').withData;
const { t, NULL_ADDRESS, createMocks } = require('../utils/consts');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Loans = artifacts.require('./base/TokenCollateralLoans.sol');

// Libraries
const LoanLib = artifacts.require('../util/LoanLib.sol');

contract('TokenCollateralLoansInitializeTest', function (accounts) {
  let mocks;

  beforeEach('Setup for each test', async () => {
    mocks = await createMocks(Mock, 20);
  });

  const getInstance = (refs, index, accountIndex) =>
    index === -1 ? NULL_ADDRESS : index === 99 ? accounts[accountIndex] : refs[index];

  withData(
    {
      _1_basic: [3, 4, 5, 6, undefined, false],
      _2_not_lendingpool: [-1, 4, 5, 6, 'PROVIDE_LENDING_POOL_ADDRESS', true],
      _3_not_loanTerms: [3, -1, 5, 6, 'PROVIDED_LOAN_TERMS_ADDRESS', true],
      _4_not_settings: [3, 4, -1, 6, 'SETTINGS_MUST_BE_PROVIDED', true],
      _5_not_collateralToken: [3, 4, 5, -1, 'PROVIDE_COLL_TOKEN_ADDRESS', true],
    },
    function (
      lendingPoolIndex,
      loanTermsConsensusIndex,
      settingsIndex,
      collateralTokenIndex,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t(
          'user',
          'initialize',
          'Should (or not) be able to create a new instance.',
          mustFail
        ),
        async function () {
          // Setup
          const loanLib = await LoanLib.new();
          await Loans.link('LoanLib', loanLib.address);
          const loansInstance = await Loans.new();
          const lendingPoolAddress = getInstance(mocks, lendingPoolIndex, 3);
          const loanTermsConsensusAddress = getInstance(
            mocks,
            loanTermsConsensusIndex,
            4
          );
          const settingsAddress = getInstance(mocks, settingsIndex, 5);
          const collateralTokenAddress = getInstance(mocks, collateralTokenIndex, 6);

          try {
            // Invocation
            const result = await loansInstance.initialize(
              lendingPoolAddress,
              loanTermsConsensusAddress,
              settingsAddress,
              collateralTokenAddress
            );

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert(result);
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage, error.reason);
          }
        }
      );
    }
  );
});
