pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../util/AddressLib.sol";
import "../util/CacheLib.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "./BaseUpgradeable.sol";

// Interfaces
import "../interfaces/AssetSettingsInterface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice Asset settings contract for a specific asset on the protocol.

    @author develop@teller.finance
 */
contract AssetSettings is AssetSettingsInterface, Pausable, BaseUpgradeable {
    using AddressLib for address;
    using CacheLib for CacheLib.Cache;

    /** Constants */
    /**
        @notice The asset setting name for cToken address settings.
     */
    bytes32 public constant CTOKEN_ADDRESS_ASSET_SETTING = keccak256("CTokenAddress");

    /**
        @notice The asset setting name for cToken address settings.
     */
    bytes32 public constant YEARN_VAULT_ADDRESS_ASSET_SETTING = keccak256(
        "YVaultAddress"
    );

    /**
        @notice The asset setting name for cToken address settings.
     */
    bytes32 public constant CRV_POOL_ADDRESS_ASSET_SETTING = keccak256("CRVPoolAddress");

    /**
        @notice The asset setting name for the maximum loan amount settings.
     */
    bytes32 public constant MAX_LOAN_AMOUNT_ASSET_SETTING = keccak256("MaxLoanAmount");

    /**
        @notice The asset setting name for the maximum total value locked settings.
     */
    bytes32 public constant MAX_TOTAL_VALUE_LOCKED_SETTING = keccak256("MaxTVLAmount");

    /**
        @notice This mapping represents the asset settings where:

        - The key is the asset address.
        - The value is the Cache for all asset settings. It includes the settings addresses, uints, ints, bytes and boolean values.
     */
    mapping(address => CacheLib.Cache) internal assets;

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
    ) external onlyPauser() {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");
        require(maxLoanAmount > 0, "INIT_MAX_AMOUNT_REQUIRED");

        assets[assetAddress].initialize();
        assets[assetAddress].updateAddress(CTOKEN_ADDRESS_ASSET_SETTING, cTokenAddress);
        assets[assetAddress].updateUint(MAX_LOAN_AMOUNT_ASSET_SETTING, maxLoanAmount);
    }

    /**
        @notice It updates the cToken address associted with an asset.
        @param assetAddress asset address to configure.
        @param cTokenAddress the new cToken address to configure.
     */
    function updateCTokenAddress(address assetAddress, address cTokenAddress)
        external
        onlyPauser()
    {
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");

        assets[assetAddress].updateAddress(CTOKEN_ADDRESS_ASSET_SETTING, cTokenAddress);
    }

    /**
        @notice It returns the cToken address associted with an asset.
        @param assetAddress asset address to get the associated cToken for.
        @return The associated cToken address
     */
    function getCTokenAddress(address assetAddress) external view returns (address) {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return assets[assetAddress].addresses[CTOKEN_ADDRESS_ASSET_SETTING];
    }

    /**
        @notice It updates the yearn vault address associted with an asset.
        @param assetAddress asset address to configure.
        @param yVaultAddress the new yVault address to configure.
     */
    function updateYVaultAddressSetting(address assetAddress, address yVaultAddress)
        external
        onlyPauser()
    {
        assets[assetAddress].updateAddress(
            YEARN_VAULT_ADDRESS_ASSET_SETTING,
            yVaultAddress
        );
    }

    /**
        @notice It returns the yearn vault address associted with an asset.
        @param assetAddress asset address to get the associated yearn vault address for.
        @return The address of the yearn vault.
     */
    function getYVaultAddress(address assetAddress) external view returns (address) {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return assets[assetAddress].addresses[CTOKEN_ADDRESS_ASSET_SETTING];
    }

    /**
        @notice It updates the curve pool address associted with an asset.
        @param assetAddress asset address to configure.
        @param crvPoolAddress the new Curve pool address to configure.
     */
    function updateCRVPoolAddressSetting(address assetAddress, address crvPoolAddress)
        external
        onlyPauser()
    {
        assets[assetAddress].updateAddress(
            CRV_POOL_ADDRESS_ASSET_SETTING,
            crvPoolAddress
        );
    }

    /**
        @notice It returns the curve pool address associted with an asset.
        @param assetAddress asset address to get the associated curve pool address for.
        @return The address of the curve pool.
     */
    function getCRVPoolAddress(address assetAddress) external view returns (address) {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return assets[assetAddress].addresses[CRV_POOL_ADDRESS_ASSET_SETTING];
    }

    /**
        @notice It updates the max loan amount for a given asset.
        @param assetAddress asset address used to update the max loan amount.
        @param newMaxLoanAmount the new max loan amount to set.
     */
    function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount)
        external
        onlyPauser()
    {
        assets[assetAddress].requireExists();

        assets[assetAddress].updateUint(MAX_LOAN_AMOUNT_ASSET_SETTING, newMaxLoanAmount);
    }

    /**
        @notice Returns the max loan amount for a given asset.
        @param assetAddress asset address to retrieve the max loan amount.
     */
    function getMaxLoanAmount(address assetAddress) external view returns (uint256) {
        assets[assetAddress].requireExists();

        return assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];
    }

    /**
        @notice Tests whether a given amount is greater than the current max loan amount.
        @param assetAddress asset address used to return the max loan amount setting.
        @param amount the loan amount to check.
        @return true if the given amount is greater than the current max loan amount. Otherwise it returns false.
     */
    function exceedsMaxLoanAmount(address assetAddress, uint256 amount)
        external
        view
        returns (bool)
    {
        assets[assetAddress].requireExists();
        return amount > assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];
    }

    /**
        @notice It updates the max total vaule locked amount for a given asset.
        @param assetAddress asset address used to update the max loan amount.
        @param newMaxTVLAmount the new max total vault locked amount to set.
     */
    function updateMaxTVL(address assetAddress, uint256 newMaxTVLAmount)
        external
        onlyPauser()
    {
        assets[assetAddress].requireExists();

        assets[assetAddress].updateUint(MAX_TOTAL_VALUE_LOCKED_SETTING, newMaxTVLAmount);
    }

    /**
        @notice Returns the max total value locked amount for a given asset.
        @param assetAddress asset address to retrieve the max total value locked amount.
     */
    function getMaxTVLAmount(address assetAddress) external view returns (uint256) {
        assets[assetAddress].requireExists();

        return assets[assetAddress].uints[MAX_TOTAL_VALUE_LOCKED_SETTING];
    }

    /**
        @notice It removes a configuration for a given asset on the platform.
        @param assetAddress asset address to remove.
     */
    function removeAsset(address assetAddress) external onlyPauser() {
        assets[assetAddress].requireExists();
        assets[assetAddress].clearCache(
            [
                MAX_LOAN_AMOUNT_ASSET_SETTING,
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                CTOKEN_ADDRESS_ASSET_SETTING,
                YEARN_VAULT_ADDRESS_ASSET_SETTING,
                CRV_POOL_ADDRESS_ASSET_SETTING
            ],
            [
                CacheLib.CacheType.Uint,
                CacheLib.CacheType.Uint,
                CacheLib.CacheType.Address,
                CacheLib.CacheType.Address,
                CacheLib.CacheType.Address
            ]
        );
        delete assets[assetAddress];
    }
}
