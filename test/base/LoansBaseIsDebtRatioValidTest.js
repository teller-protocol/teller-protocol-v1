// JS Libraries
const withData = require("leche").withData;

const { t, NULL_ADDRESS } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");

const ATMSettingsEncoder = require("../utils/encoders/ATMSettingsEncoder");
const MarketsStateEncoder = require("../utils/encoders/MarketsStateEncoder");
const ATMGovernanceEncoder = require("../utils/encoders/ATMGovernanceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");
const Loans = artifacts.require("./mock/base/LoansBaseMock.sol");

// Libraries
const LoanLib = artifacts.require("../util/LoanLib.sol");

contract("LoansBaseIsDebtRatioValidTest", function(accounts) {
  const atmSettingsEncoder = new ATMSettingsEncoder(web3);
  const marketsStateEncoder = new MarketsStateEncoder(web3);
  const atmGovernanceEncoder = new ATMGovernanceEncoder(web3);

  let instance;
  let marketsInstance;
  let atmSettingsInstance;

  beforeEach("Setup for each test", async () => {
    const settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        Mock,
        initialize: true,
        onInitialize: async (instance, { marketsState, atmSettings }) => {
          marketsInstance = marketsState;
          atmSettingsInstance = atmSettings;
        }
      });

    const lendingPoolInstance = await Mock.new();
    const loanTermsConsInstance = await Mock.new();
    const collateralTokenInstance = await Mock.new();
    const loanLib = await LoanLib.new();
    await Loans.link("LoanLib", loanLib.address);
    instance = await Loans.new();
    await instance.initialize(
      lendingPoolInstance.address,
      loanTermsConsInstance.address,
      settingsInstance.address,
      collateralTokenInstance.address
    );
  });

  withData({
    _1_basic: [ 1500, false, 5000, 4500, true, undefined, false ],
    _2_std_high_1: [ 1500, false, 4500, 5501, false, undefined, false ],
    _3_std_high_2: [ 1500, false, 4500, 4501, false, undefined, false ],
    _4_empty_atm_governance: [ 1500, true, 5000, 4500, false, "ATM_NOT_FOUND_FOR_MARKET", true ]
  }, function(
    loanAmount,
    useEmptyATMGovernanceAddress,
    getGeneralSettingResponse,
    getDebtRatioForResponse,
    expectedResult,
    expectedErrorMessage,
    mustFail
  ) {
    it(t("user", "_isDebtRatioValid", "Should able to test whether the debt ratio is valid or not.", mustFail), async function() {
      // Setup
      const atmGovernanceInstance = await Mock.new();
      const atmGovernanceAddress = useEmptyATMGovernanceAddress ? NULL_ADDRESS : atmGovernanceInstance.address;
      await atmSettingsInstance.givenMethodReturnAddress(
        atmSettingsEncoder.encodeGetATMForMarket(),
        atmGovernanceAddress
      );
      await atmGovernanceInstance.givenMethodReturnUint(
        atmGovernanceEncoder.encodeGetGeneralSetting(),
        getGeneralSettingResponse
      );
      await marketsInstance.givenMethodReturnUint(
        marketsStateEncoder.encodeGetDebtRatioFor(),
        getDebtRatioForResponse
      );

      try {
        // Invocation
        const result = await instance.externalIsDebtRatioValid(loanAmount);

        // Assertions
        assert(!mustFail, "It should have failed because data is invalid.");
        assert.equal(result.toString(), expectedResult.toString());
      } catch (error) {
        // Assertions
        assert(mustFail);
        assert(error);
        assert(error.message.includes(expectedErrorMessage));
      }
    });
  });
});
