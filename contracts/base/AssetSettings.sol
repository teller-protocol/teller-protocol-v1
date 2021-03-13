pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../util/AddressLib.sol";
import "../util/CacheLib.sol";

// Contracts
import "./Base.sol";

// Interfaces
import "../interfaces/AssetSettingsInterface.sol";
import "../providers/compound/CErc20Interface.sol";

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
contract AssetSettings is AssetSettingsInterface, Base {
    using AddressLib for address;
    using CacheLib for CacheLib.Cache;

    /**
          @notice This mapping represents the asset settings where:

          - The key is the asset address.
          - The value is the Cache for all asset settings. It includes the settings addresses, uints, ints, bytes and boolean values.
       */
    mapping(address => CacheLib.Cache) internal assets;

    /** Constants */
    /**
          @notice The asset setting name for cToken address settings.
       */
    bytes32 internal constant CTOKEN_ADDRESS_ASSET_SETTING =
        keccak256("CTokenAddress");

    /**
          @notice The asset setting name for aToken address settings.
       */
    bytes32 internal constant ATOKEN_ADDRESS_ASSET_SETTING =
        keccak256("ATokenAddress");

    /**
          @notice The asset setting name for yearn vault address settings.
       */
    bytes32 internal constant YEARN_VAULT_ADDRESS_ASSET_SETTING =
        keccak256("YVaultAddress");

    /**
          @notice The asset setting name for curve pool address settings.
       */
    bytes32 internal constant CRV_POOL_ADDRESS_ASSET_SETTING =
        keccak256("CRVPoolAddress");

    /**
          @notice The asset setting name for the maximum loan amount settings.
       */
    bytes32 internal constant MAX_LOAN_AMOUNT_ASSET_SETTING =
        keccak256("MaxLoanAmount");

    /**
          @notice The asset setting name for the maximum total value locked settings.
       */
    bytes32 internal constant MAX_TOTAL_VALUE_LOCKED_SETTING =
        keccak256("MaxTVLAmount");

    /**
          @notice The asset setting name for the maximum debt ratio settings.
       */
    bytes32 internal constant MAX_DEBT_RATIO_SETTING =
        keccak256("MaxDebtRatio");

    /**
      @notice It creates an asset with the given parameters.
      @param assetAddress asset address used to create the new setting.
      @param cTokenAddress cToken address used to configure the asset setting.
      @param maxLoanAmount the initial max loan amount.
      @param maxTVLAmount the initial max total value locked amount.
      @param maxDebtRatio the initial max debt ratio amount.
      */
    function createAssetSetting(
        address assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount,
        uint256 maxTVLAmount,
        uint256 maxDebtRatio
    ) external onlyPauser() {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");

        if (assetAddress != settings.ETH_ADDRESS()) {
            (bool success, bytes memory decimalsData) =
                assetAddress.staticcall(abi.encodeWithSignature("decimals()"));
            require(
                success && decimalsData.length > 0,
                "DECIMALS_NOT_SUPPORTED"
            );
            require(
                CErc20Interface(cTokenAddress).underlying() == assetAddress,
                "UNDERLYING_ASSET_MISMATCH"
            );
        }

        assets[assetAddress].initialize();
        assets[assetAddress].updateAddress(
            CTOKEN_ADDRESS_ASSET_SETTING,
            cTokenAddress
        );
        if (maxLoanAmount > 0) {
            assets[assetAddress].updateUint(
                MAX_LOAN_AMOUNT_ASSET_SETTING,
                maxLoanAmount
            );
        }
        if (maxTVLAmount > 0) {
            assets[assetAddress].updateUint(
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                maxTVLAmount
            );
        }
        if (maxDebtRatio > 0) {
            assets[assetAddress].updateUint(
                MAX_DEBT_RATIO_SETTING,
                maxDebtRatio
            );
        }

        emit AssetSettingsCreated(
            msg.sender,
            assetAddress,
            cTokenAddress,
            maxLoanAmount
        );
    }

    /**
      @notice It updates the cToken address associated with an asset.
      @param assetAddress asset address to configure.
      @param cTokenAddress the new cToken address to configure.
      */
    function updateCTokenAddress(address assetAddress, address cTokenAddress)
        external
        onlyPauser()
    {
        cTokenAddress.requireNotEmpty("CTOKEN_ADDRESS_REQUIRED");
        address oldCTokenAddress =
            assets[assetAddress].addresses[CTOKEN_ADDRESS_ASSET_SETTING];

        assets[assetAddress].updateAddress(
            CTOKEN_ADDRESS_ASSET_SETTING,
            cTokenAddress
        );

        emit AssetSettingsAddressUpdated(
            CTOKEN_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldCTokenAddress,
            cTokenAddress
        );
    }

    /**
      @notice It returns the cToken address associated with an asset.
      @param assetAddress asset address to get the associated cToken for.
      @return The associated cToken address
      */
    function getCTokenAddress(address assetAddress)
        external
        view
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return assets[assetAddress].addresses[CTOKEN_ADDRESS_ASSET_SETTING];
    }

    /**
      @notice It updates the yearn vault address associated with an asset.
      @param assetAddress asset address to configure.
      @param yVaultAddress the new yVault address to configure.
      */
    function updateYVaultAddressSetting(
        address assetAddress,
        address yVaultAddress
    ) external onlyPauser() {
        assets[assetAddress].updateAddress(
            YEARN_VAULT_ADDRESS_ASSET_SETTING,
            yVaultAddress
        );
    }

    /**
      @notice It returns the yearn vault address associated with an asset.
      @param assetAddress asset address to get the associated yearn vault address for.
      @return The address of the yearn vault.
      */
    function getYVaultAddress(address assetAddress)
        external
        view
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return
            assets[assetAddress].addresses[YEARN_VAULT_ADDRESS_ASSET_SETTING];
    }

    /**
      @notice It updates the aToken address associated with an asset.
      @param assetAddress asset address to configure.
      @param aTokenAddress the new aToken address to configure.
      */
    function updateATokenAddress(address assetAddress, address aTokenAddress)
        external
        onlyPauser()
    {
        aTokenAddress.requireNotEmpty("ATOKEN_ADDRESS_REQUIRED");
        address oldATokenAddress =
            assets[assetAddress].addresses[ATOKEN_ADDRESS_ASSET_SETTING];

        assets[assetAddress].updateAddress(
            ATOKEN_ADDRESS_ASSET_SETTING,
            aTokenAddress
        );

        emit AssetSettingsAddressUpdated(
            ATOKEN_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldATokenAddress,
            aTokenAddress
        );
    }

    /**
      @notice It returns the aToken address associated with an asset.
      @param assetAddress asset address to get the associated aToken for.
      @return The associated aToken address
      */
    function getATokenAddress(address assetAddress)
        external
        view
        returns (address)
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_REQUIRED");

        return assets[assetAddress].addresses[ATOKEN_ADDRESS_ASSET_SETTING];
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
        uint256 oldMaxLoanAmount =
            assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];

        assets[assetAddress].updateUint(
            MAX_LOAN_AMOUNT_ASSET_SETTING,
            newMaxLoanAmount
        );

        emit AssetSettingsUintUpdated(
            MAX_LOAN_AMOUNT_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldMaxLoanAmount,
            newMaxLoanAmount
        );
    }

    /**
      @notice Returns the max loan amount for a given asset.
      @param assetAddress asset address to retrieve the max loan amount.
      */
    function getMaxLoanAmount(address assetAddress)
        external
        view
        returns (uint256)
    {
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
        return
            amount > assets[assetAddress].uints[MAX_LOAN_AMOUNT_ASSET_SETTING];
    }

    /**
      @notice It updates the max total value locked amount for a given asset.
      @param assetAddress asset address used to update the max loan amount.
      @param newMaxTVLAmount the new max total vault locked amount to set.
      */
    function updateMaxTVL(address assetAddress, uint256 newMaxTVLAmount)
        external
        onlyPauser()
    {
        assets[assetAddress].requireExists();
        if (
            newMaxTVLAmount !=
            assets[assetAddress].uints[MAX_TOTAL_VALUE_LOCKED_SETTING]
        ) {
            assets[assetAddress].updateUint(
                MAX_TOTAL_VALUE_LOCKED_SETTING,
                newMaxTVLAmount
            );
        }
    }

    /**
      @notice Returns the max total value locked amount for a given asset.
      @param assetAddress asset address to retrieve the max total value locked amount.
      */
    function getMaxTVLAmount(address assetAddress)
        external
        view
        returns (uint256)
    {
        assets[assetAddress].requireExists();

        return assets[assetAddress].uints[MAX_TOTAL_VALUE_LOCKED_SETTING];
    }

    /**
      @notice It updates the max debt ratio for a given asset.
      @dev The ratio value has 2 decimal places. I.e 100 = 1%
      @param assetAddress asset address used to update the max debt ratio.
      @param newMaxDebtRatio the new max debt ratio to set.
      */
    function updateMaxDebtRatio(address assetAddress, uint256 newMaxDebtRatio)
        external
        onlyPauser()
    {
        assets[assetAddress].requireExists();
        if (
            newMaxDebtRatio !=
            assets[assetAddress].uints[MAX_DEBT_RATIO_SETTING]
        ) {
            assets[assetAddress].updateUint(
                MAX_DEBT_RATIO_SETTING,
                newMaxDebtRatio
            );
        }
    }

    /**
      @notice Returns the max debt ratio for a given asset.
      @dev The ratio value has 2 decimal places. I.e 100 = 1%
      @param assetAddress asset address to retrieve the max debt ratio.
      */
    function getMaxDebtRatio(address assetAddress)
        external
        view
        returns (uint256)
    {
        assets[assetAddress].requireExists();
        return assets[assetAddress].uints[MAX_DEBT_RATIO_SETTING];
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
        emit AssetSettingsRemoved(msg.sender, assetAddress);
    }

    function initialize() external isNotInitialized {
        _initialize(msg.sender);
    }
}
