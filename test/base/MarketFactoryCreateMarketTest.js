// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, createMocks, ETH_ADDRESS } = require("../utils/consts");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const { marketFactory } = require("../utils/events");
const LogicVersionsRegistryEncoder = require("../utils/encoders/LogicVersionsRegistryEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const MarketFactory = artifacts.require("./base/MarketFactory.sol");
const Settings = artifacts.require("./base/Settings.sol");

contract("MarketFactoryCreateMarketTest", function(accounts) {
  const logicVersionsRegistryEncoder = new LogicVersionsRegistryEncoder(web3);

  const owner = accounts[0];
  let instance;
  let settingsInstance;
  let versionsRegistryInstance;
  let mocks;


  beforeEach("Setup for each test", async () => {
    mocks = await createMocks(Mock, 10);

    settingsInstance = await createTestSettingsInstance(
      Settings,
      {
        from: owner,
        Mock,
        initialize: true,
        onInitialize: async (instance, { versionsRegistry }) => {
          versionsRegistryInstance = versionsRegistry;
        }
      }
    );

    const constsInstance = await Mock.new();
    await versionsRegistryInstance.givenMethodReturnAddress(
      logicVersionsRegistryEncoder.encodeConsts(),
      constsInstance.address
    );

    instance = await MarketFactory.new();
    await instance.initialize(
      settingsInstance.address
    );
  });

  const getInstance = (refs, index, accountIndex) => index === -1 ? NULL_ADDRESS : index === 99 ? accounts[accountIndex] : refs[index];

  withData({
    _1_basic: [ 0, false, 2, 3, 4, 6, false, undefined ],
    _2_platform_paused: [ 0, true, 2, 3, 4, 6, true, "PLATFORM_IS_PAUSED" ],
    _3_not_pauser_role: [ 4, false, 2, 3, 4, 6, true, "NOT_PAUSER" ],
    _4_ttoken_not_contract: [ 0, false, 99, 3, 4, 6, true, "TTOKEN_MUST_BE_CONTRACT" ],
    _5_ttoken_empty: [ 0, false, -1, 3, 4, 6, true, "TTOKEN_MUST_BE_CONTRACT" ],
    _6_borrowed_token_not_ccontract: [ 0, false, 2, 99, 4, 6, true, "BORROWED_TOKEN_MUST_BE_CONTRACT" ],
    _7_borrowed_token_empty: [ 0, false, 2, -1, 4, 6, true, "BORROWED_TOKEN_MUST_BE_CONTRACT" ],
    _8_coll_token_eth: [ 0, false, 2, 3, 100, 6, false, undefined ],
    _9_coll_token_not_contract: [ 0, false, 2, 3, 99, 6, true, "COLL_TOKEN_MUST_BE_CONTRACT" ],
    _10_coll_token_empty: [ 0, false, 2, 3, -1, 6, true, "COLL_TOKEN_MUST_BE_CONTRACT" ]
  }, function(
    senderIndex,
    pausePlatform,
    tTokenIndex,
    borrowedTokenIndex,
    collateralTokenIndex,
    cTokenAddressResponseIndex,
    mustFail,
    expectedErrorMessage
  ) {
    it(t("user", "createMarket", "Should able (or not) to create a market correctly.", mustFail), async function() {
      // Setup
      const sender = accounts[senderIndex];
      const tTokenAddress = getInstance(mocks, tTokenIndex, 2);
      const borrowedTokenAddress = getInstance(mocks, borrowedTokenIndex, 3);
      const collateralTokenAddress = collateralTokenIndex === 100 ? ETH_ADDRESS : getInstance(mocks, collateralTokenIndex, 4);
      const cTokenAddressResponse = getInstance(mocks, cTokenAddressResponseIndex, 5);
      await versionsRegistryInstance.givenMethodReturnBool(
        logicVersionsRegistryEncoder.encodeHasLogicVersion(),
        true
      );
      if (borrowedTokenIndex !== 99 && borrowedTokenIndex !== -1) {
        await settingsInstance.createAssetSettings(
          borrowedTokenAddress,
          cTokenAddressResponse,
          "10000",
          { from: owner }
        );
      }
      if (pausePlatform) {
        await settingsInstance.pause({ from: owner });
      }

      try {
        // Invocation
        const result = await instance.createMarket(
          tTokenAddress,
          borrowedTokenAddress,
          collateralTokenAddress,
          { from: sender }
        );
        // Assertions
        assert(!mustFail, "It should have failed because data is invalid.");
        assert(result);

        const newMarket = await instance.getMarket(borrowedTokenAddress, collateralTokenAddress);

        assert(newMarket.exists);
        marketFactory
          .newMarketCreated(result)
          .emitted(
            sender,
            borrowedTokenAddress,
            collateralTokenAddress,
            newMarket.loans,
            newMarket.lenders,
            newMarket.lendingPool,
            newMarket.loanTermsConsensus,
            newMarket.interestConsensus
          );
      } catch (error) {
        // Assertions
        assert(mustFail, error.message);
        assert.equal(error.reason, expectedErrorMessage);
      }
    });
  });
});