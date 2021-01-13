// JS Libraries
const withData = require("leche").withData;
const { t, NULL_ADDRESS, toDecimals, encode } = require("../utils/consts");
const { MaxLoanAmountSetting } = require("../utils/asset-settings-names");
const { settings } = require("../utils/events");
const { createAssetSettings } = require("../utils/asset-settings-helper");
const { createTestSettingsInstance } = require("../utils/settings-helper");
const CTokenInterfaceEncoder = require("../utils/encoders/CTokenInterfaceEncoder");

// Mock contracts
const Mock = artifacts.require("./mock/util/Mock.sol");

// Smart contracts
const Settings = artifacts.require("./base/Settings.sol");

contract("SettingsCreateAssetSettingsTest", function (accounts) {
  const cTokenEncoder = new CTokenInterfaceEncoder(web3);

  let owner = accounts[0];
  let assetInstance;
  let cTokenInstance;

  beforeEach("Setup for each test", async () => {
    assetInstance = await Mock.new();
    cTokenInstance = await Mock.new();
    await cTokenInstance.givenMethodReturnAddress(
      cTokenEncoder.encodeUnderlying(),
      assetInstance.address
    );
  });

  const getContractAddress = (addressIndex, defaultInstance) => {
    return addressIndex === -1
      ? NULL_ADDRESS
      : addressIndex === 99
      ? defaultInstance.address
      : accounts[addressIndex];
  };

  const getSenderAddress = (addressIndex) => {
    return addressIndex === -1 ? NULL_ADDRESS : accounts[addressIndex];
  };

  withData(
    {
      _1_valid: [false, 0, false, 99, 99, 10000, undefined, false],
      // _2_asset_empty: [false, 0, false, -1, 99, 2000, 'ASSET_ADDRESS_MUST_BE_CONTRACT', true],
      // _3_asset_not_contract: [false, 1, true, 2, 99, 1000, 'ASSET_ADDRESS_MUST_BE_CONTRACT', true],
      // _4_cToken_not_contract: [false, 0, false, 99, 3, 2000, 'CTOKEN_MUST_BE_CONTRACT_OR_EMPTY', true],
      // _5_cToken_empty: [false, 0, false, 99, -1, 2000, undefined, false],
    },
    function (
      isPaused,
      senderIndex,
      addPauserRole,
      assetAddressIndex,
      cTokenAddressIndex,
      maxLoanAmount,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t(
          "user",
          "createAssetSettings",
          "Should (or not) be able to create a new asset instance.",
          mustFail
        ),
        async function () {
          // Setup
          const senderAddress = getSenderAddress(senderIndex);
          const assetAddress = getContractAddress(assetAddressIndex, assetInstance);
          const cTokenAddress = getContractAddress(cTokenAddressIndex, cTokenInstance);
          const instance = await createTestSettingsInstance(Settings, {
            from: owner,
            Mock,
          });
          if (addPauserRole) {
            await instance.addPauser(senderAddress, { from: owner });
          }
          if (isPaused) {
            await instance.pause({ from: owner });
          }

          try {
            // Invocation
            const result = await instance.createAssetSettings(
              assetAddress,
              cTokenAddress,
              maxLoanAmount,
              {
                from: senderAddress,
              }
            );

            // Assertions
            assert(!mustFail, "It should have failed because data is invalid.");

            settings
              .assetSettingsCreated(result)
              .emitted(owner, assetAddress, cTokenAddress, maxLoanAmount);
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );

  withData(
    {
      // _1_valid_owner: [[], false, 0, {useCurrentSetting: false, index: 99}, 99, 10000, undefined, false],
      // _2_valid_new_owner: [[], true, 2, {useCurrentSetting: false, index: 99}, 99, 20000, undefined, false],
      // _3_not_owner: [[], false, 2, {useCurrentSetting: false, index: 99}, 99, 20000, 'NOT_PAUSER', true],
      // _4_with1PreviousAssets_createNew: [
      //     [{ maxLoanAmount: toDecimals(100, 18) }], false, 0, {useCurrentSetting: false, index: 99}, 99, 20000, undefined, false
      // ],
      // _5_with2PreviousAssets_createNew_newOwner: [
      //     [
      //         { maxLoanAmount: toDecimals(900, 18) },
      //         { maxLoanAmount: toDecimals(1000, 18) }
      //     ], true, 3, {useCurrentSetting: false, index: 99}, 99, 2000, undefined, false
      // ],
      // _6_invalid_max_loan_amount_zero: [[], false, 0, {useCurrentSetting: false, index: 99}, 99, 0, 'NEW_UINT_REQUIRED', true],
      // _7_invalid_asset_already_exist: [[
      //     { maxLoanAmount: toDecimals(1900, 18) },
      //     { maxLoanAmount: toDecimals(2000, 18) }
      // ], false, 0, {useCurrentSetting: true, index: 1}, 99, 2100, 'CACHE_ALREADY_EXISTS', true],
    },
    function (
      previousAssetsInfo,
      addAsPauserRole,
      senderIndex,
      { useCurrentSetting, index: assetAddressIndex },
      cTokenAddressIndex,
      maxLoanAmount,
      expectedErrorMessage,
      mustFail
    ) {
      it(
        t(
          "user",
          "createAssetSettings#2",
          "Should (or not) be able to create a new asset instance.",
          mustFail
        ),
        async function () {
          // Setup
          const instance = await createTestSettingsInstance(Settings, {
            from: owner,
            Mock,
          });
          const senderAddress = getSenderAddress(senderIndex);
          if (addAsPauserRole) {
            await instance.addPauser(senderAddress, { from: owner });
          }
          const currentAssetsInfo = await createAssetSettings(
            Mock,
            instance,
            owner,
            previousAssetsInfo
          );
          console.log({ currentAssetsInfo });
          const assetAddress = useCurrentSetting
            ? currentAssetsInfo[assetAddressIndex].assetAddress
            : getContractAddress(assetAddressIndex, assetInstance);
          const cTokenAddress = getContractAddress(cTokenAddressIndex, cTokenInstance);

          const beforeAssets = await instance.getAssets();

          try {
            // Invocation
            const result = await instance.createAssetSettings(
              assetAddress,
              cTokenAddress,
              maxLoanAmount,
              {
                from: senderAddress,
              }
            );

            // Assertions
            assert(!mustFail, "It should have failed because data is invalid.");
            assert(result);

            settings
              .assetSettingsCreated(result)
              .emitted(senderAddress, assetAddress, cTokenAddress, maxLoanAmount);

            const cTokenAddressResult = await instance.getCTokenAddress(assetAddress);
            const maxLoanResult = await instance.getAssetSettingsUint(
              assetAddress,
              MaxLoanAmountSetting
            );
            console.log({ cTokenAddressResult, maxLoanResult });
            assert.equal(
              cTokenAddressResult.toString(),
              cTokenAddress.toString(),
              "Asset address incorrect"
            );
            assert.equal(
              maxLoanResult.toString(),
              maxLoanAmount.toString(),
              "Max loan result incorrect"
            );

            const afterAssets = await instance.getAssets();
            assert.equal(afterAssets.length, beforeAssets.length + 1);
            assert.equal(afterAssets[afterAssets.length - 1], assetAddress);
          } catch (error) {
            // Assertions
            assert(mustFail, error.message);
            assert.equal(error.reason, expectedErrorMessage);
          }
        }
      );
    }
  );
});
