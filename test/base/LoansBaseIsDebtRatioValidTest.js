// JS Libraries
const withData = require('leche').withData;

const { t, NULL_ADDRESS } = require('../utils/consts');
const { createTestSettingsInstance } = require('../utils/settings-helper');

const IATMSettingsEncoder = require('../utils/encoders/IATMSettingsEncoder');
const LendingPoolInterfaceEncoder = require('../utils/encoders/LendingPoolInterfaceEncoder');
const ATMGovernanceInterfaceEncoder = require('../utils/encoders/ATMGovernanceInterfaceEncoder');

// Mock contracts
const Mock = artifacts.require('./mock/util/Mock.sol');

// Smart contracts
const Settings = artifacts.require('./base/Settings.sol');
const Loans = artifacts.require('./mock/base/LoansBaseMock.sol');

// Libraries
const LoanLib = artifacts.require('../util/LoanLib.sol');

contract('LoansBaseIsDebtRatioValidTest', function (accounts) {
  const IAtmSettingsEncoder = new IATMSettingsEncoder(web3);
  const lendingPoolEncoder = new LendingPoolInterfaceEncoder(web3);
  const atmGovernanceInterfaceEncoder = new ATMGovernanceInterfaceEncoder(web3);

  let instance;
  let lendingPoolInstance;
  let atmSettingsInstance;

  beforeEach('Setup for each test', async () => {
    const settingsInstance = await createTestSettingsInstance(Settings, {
      Mock,
      initialize: true,
      onInitialize: async (instance, { atmSettings }) => {
        atmSettingsInstance = atmSettings;
      },
    });

    lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    const collateralTokenInstance = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link('LoanLib', loanLib.address);
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address
    );
  });

  withData(
    {
      _1_basic: [1500, false, 5000, 4500, true, undefined, false],
      _2_std_high_1: [1500, false, 4500, 5501, false, undefined, false],
      _3_std_high_2: [1500, false, 4500, 4501, false, undefined, false],
      _4_empty_atm_governance: [
        1500,
        true,
        5000,
        4500,
        false,
        'ATM_NOT_FOUND_FOR_MARKET',
        true,
      ],
    },
    function (
      loanAmount,
      useEmptyATMGovernanceAddress,
      getGeneralSettingResponse,
      getDebtRatioForResponse,
      expectedResult,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t(
          'user',
          '_isDebtRatioValid',
          'Should able to test whether is StD ratio is valid or not.',
          mustFail
        ),
        async function () {
          // Setup
          const atmGovernanceInstance = await Mock.new();
          const atmGovernanceAddress = useEmptyATMGovernanceAddress
            ? NULL_ADDRESS
            : atmGovernanceInstance.address;
          await atmSettingsInstance.givenMethodReturnAddress(
            IAtmSettingsEncoder.encodeGetATMForMarket(),
            atmGovernanceAddress
          );
          await atmGovernanceInstance.givenMethodReturnUint(
            atmGovernanceInterfaceEncoder.encodeGetGeneralSetting(),
            getGeneralSettingResponse
          );
          await lendingPoolInstance.givenMethodReturnUint(
            lendingPoolEncoder.encodeGetDebtRatioFor(),
            getDebtRatioForResponse
          );

          try {
            // Invocation
            const result = await instance.externalIsDebtRatioValid(loanAmount);

            // Assertions
            assert(!mustFail, 'It should have failed because data is invalid.');
            assert.equal(result.toString(), expectedResult.toString());
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert(error.message.includes(expectedErrorMessage), error.message);
          }
        }
      );
    }
  );
});
