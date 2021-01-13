pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/CacheLib.sol";

/**
    @notice This interface defines all function to manage the asset settings on the platform.

    @author develop@teller.finance
 */
interface AssetSettingsInterface {
  /**
        @notice It creates an asset with the given parameters.
        @param assetAddress asset address used to create the new setting.
        @param cTokenAddress cToken address used to configure the asset setting.
        @param maxLoanAmount the initial max loan amount.
     */
  function createAssetSetting(
    address assetAddress,
    address cTokenAddress,
    uint256 maxLoanAmount
  ) external;

  /**
        @notice It updates the cToken address associted with an asset.
        @param assetAddress asset address to configure.
        @param cTokenAddress the new cToken address to configure.
     */
  function updateCTokenAddress(address assetAddress, address cTokenAddress) external;

  /**
        @notice It returns the cToken address associted with an asset.
        @param assetAddress asset address to get the associated cToken for.
        @return The associated cToken address
     */
  function getCTokenAddress(address assetAddress) external view returns (address);

  /**
        @notice It updates the yearn vault address associted with an asset.
        @param assetAddress asset address to configure.
        @param yVaultAddress the new yVault address to configure.
     */
  function updateYVaultAddressSetting(address assetAddress, address yVaultAddress)
    external;

  /**
        @notice It returns the yearn vault address associted with an asset.
        @param assetAddress asset address to get the associated yearn vault address for.
        @return The address of the yearn vault.
     */
  function getYVaultAddress(address assetAddress) external view returns (address);

  /**
        @notice It updates the curve pool address associted with an asset.
        @param assetAddress asset address to configure.
        @param crvPoolAddress the new Curve pool address to configure.
     */
  function updateCRVPoolAddressSetting(address assetAddress, address crvPoolAddress)
    external;

  /**
        @notice It returns the curve pool address associted with an asset.
        @param assetAddress asset address to get the associated curve pool address for.
        @return The address of the curve pool.
     */
  function getCRVPoolAddress(address assetAddress) external view returns (address);

  /**
        @notice It updates the max loan amount for a given asset.
        @param assetAddress asset address used to update the max loan amount.
        @param newMaxLoanAmount the new max loan amount to set.
     */
  function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount) external;

  /**
        @notice Returns the max loan amount for a given asset.
        @param assetAddress asset address to retrieve the max loan amount.
     */
  function getMaxLoanAmount(address assetAddress) external view returns (uint256);

  /**
        @notice Tests whether a given amount is greater than the current max loan amount.
        @param assetAddress asset address used to return the max loan amount setting.
        @param amount the loan amount to check.
        @return true if the given amount is greater than the current max loan amount. Otherwise it returns false.
     */
  function exceedsMaxLoanAmount(address assetAddress, uint256 amount)
    external
    view
    returns (bool);

  /**
        @notice It updates the max total vaule locked amount for a given asset.
        @param assetAddress asset address used to update the max loan amount.
        @param newMaxTVLAmount the new max total vault locked amount to set.
     */
  function updateMaxTVL(address assetAddress, uint256 newMaxTVLAmount) external;

  /**
        @notice Returns the max total value locked amount for a given asset.
        @param assetAddress asset address to retrieve the max total value locked amount.
     */
  function getMaxTVLAmount(address assetAddress) external view returns (uint256);

  /**
        @notice It removes a configuration for a given asset on the platform.
        @param assetAddress asset address to remove.
     */
  function removeAsset(address assetAddress) external;
}
