pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../util/AddressLib.sol";
import "../util/AssetSettingsLib.sol";
import "../util/PlatformSettingsLib.sol";
import "../util/AddressArrayLib.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "../util/SettingsConsts.sol";
import "./BaseUpgradeable.sol";
import "./TInitializable.sol";

// Interfaces
import "../interfaces/ISettings.sol";
import "../interfaces/IEscrowFactory.sol";
import "../interfaces/IMarketsState.sol";
import "../interfaces/IInterestValidator.sol";
import "../providers/chainlink/IChainlinkAggregator.sol";
import "../providers/compound/CErc20Interface.sol";
import "../settings/IATMSettings.sol";

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
    @notice This contract manages the configuration of the platform.
    @dev The platform settings functions (create, update, and remove) don't include the whenNotPaused() modifier because we might need to use them in both cases (when the platform is paused and not paused).
        Example:
            - There is a potential issue and before analyzing it, we pause the platform to avoid funds losses. Finally, as result of the analysis, we decided to update a platform setting (or create a new one for the cloud nodes). In this scenario, if the modifier is present, we couldn't update the setting (because the platform is paused).

    @author develop@teller.finance
 */
contract Settings is ISettings, TInitializable, Pausable, BaseUpgradeable {
    using AddressLib for address;
    using Address for address;
    using AssetSettingsLib for AssetSettingsLib.AssetSettings;
    using AddressArrayLib for address[];
    using PlatformSettingsLib for PlatformSettingsLib.PlatformSetting;

    /** Constants */

    /**
        @notice The contract that hold global constant variables.
        @dev It is set by the initialize function
     */
    SettingsConsts public consts;

    /**
        @notice The asset setting name for the maximum loan amount settings.
     */
    bytes32 public constant MAX_LOAN_AMOUNT_ASSET_SETTING = "MaxLoanAmount";

    /**
        @notice The asset setting name for cToken address settings.
     */
    bytes32 public constant CTOKEN_ADDRESS_ASSET_SETTING = "CTokenAddress";

    /**
        @notice It defines the constant address to represent ETHER.
     */
    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

    /**
        @notice It defines the constant address to represent the canonical WETH token.
        @dev It is set via the initialize function.
     */
    address public WETH_ADDRESS;

    /**
        @notice It defines Compound Ether token address on current network.
        @dev It is set by the initialize function.
     */
    address public CETH_ADDRESS;

    /* State Variables */

    /**
        @notice It represents a mapping to identify the lending pools paused and not paused.

        i.e.: address(lending pool) => true or false.
     */
    mapping(address => bool) public lendingPoolPaused;

    /**
        @notice It represents a mapping to configure the asset settings.
        @notice The key belongs to the asset address. Example: address(DAI) or address(USDC).
        @notice The value has the asset settings.

        Examples:

        address(DAI) => {
            cTokenAddress = 0x1234...890
            maxLoanAmount = 1000 DAI (max)
        }
        address(USDC) => {
            cTokenAddress = 0x2345...901
            maxLoanAmount = 500 USDC (max)
        }
     */
    mapping(address => AssetSettingsLib.AssetSettings) public assetSettings;

    /**
        @notice It contains all the current assets.
     */
    address[] public assets;

    /**
        @notice This mapping represents the platform settings where:

        - The key is the platform setting name.
        - The value is the platform setting. It includes the value, minimum and maximum values.
     */
    mapping(bytes32 => PlatformSettingsLib.PlatformSetting) public platformSettings;

    /**
        @notice It is the global instance of the EscrowFactory contract.
     */
    IEscrowFactory public escrowFactory;

    /**
        @notice It is the global instance of the logic versions registry contract.
     */
    ILogicVersionsRegistry public versionsRegistry;

    /**
        @notice It is the global instance of the ChainlinkAggregator contract.
     */
    IChainlinkAggregator public chainlinkAggregator;

    /**
        @notice The markets state.
     */
    IMarketsState public marketsState;

    /**
        @notice The current interest validator.
     */
    IInterestValidator public interestValidator;

    /**
        @notice The current ATM settings.
     */
    IATMSettings public atmSettings;

    /**
        @notice This mapping represents the list of wallet addresses that are allowed to interact with the protocol
        
        - The key is belongs to the user's wallet address
        - The value is a boolean flag indicating if the address has permissions
     */
    mapping(address => bool) public authorizedAddresses;

    /**
        @notice Flag restricting the use of the Protocol to authorizedAddress
     */
    bool platformRestricted;

    /** Modifiers */

    /* Constructor */

    /** External Functions */

    /**
        @notice It creates a new platform setting given a setting name, value, min and max values.
        @param settingName setting name to create.
        @param value the initial value for the given setting name.
        @param minValue the min value for the setting.
        @param maxValue the max value for the setting.
     */
    function createPlatformSetting(
        bytes32 settingName,
        uint256 value,
        uint256 minValue,
        uint256 maxValue
    ) external onlyPauser() isInitialized() {
        require(settingName != "", "SETTING_NAME_MUST_BE_PROVIDED");
        platformSettings[settingName].initialize(value, minValue, maxValue);

        emit PlatformSettingCreated(settingName, msg.sender, value, minValue, maxValue);
    }

    /**
        @notice It updates an existent platform setting given a setting name.
        @notice It only allows to update the value (not the min or max values).
        @notice In case you need to update the min or max values, you need to remove it, and create it again.
        @param settingName setting name to update.
        @param newValue the new value to set.
     */
    function updatePlatformSetting(bytes32 settingName, uint256 newValue)
        external
        onlyPauser()
        isInitialized()
    {
        uint256 oldValue = platformSettings[settingName].update(newValue);

        emit PlatformSettingUpdated(settingName, msg.sender, oldValue, newValue);
    }

    /**
        @notice Removes a current platform setting given a setting name.
        @param settingName to remove.
     */
    function removePlatformSetting(bytes32 settingName)
        external
        onlyPauser()
        isInitialized()
    {
        uint256 oldValue = platformSettings[settingName].value;
        platformSettings[settingName].remove();

        emit PlatformSettingRemoved(settingName, oldValue, msg.sender);
    }

    /**
        @notice It gets the current platform setting for a given setting name
        @param settingName to get.
        @return the current platform setting.
     */
    function getPlatformSetting(bytes32 settingName)
        external
        view
        returns (PlatformSettingsLib.PlatformSetting memory)
    {
        return _getPlatformSetting(settingName);
    }

    /**
        @notice It gets the current platform setting value for a given setting name
        @param settingName to get.
        @return the current platform setting value.
     */
    function getPlatformSettingValue(bytes32 settingName)
        external
        view
        returns (uint256)
    {
        return _getPlatformSetting(settingName).value;
    }

    /**
        @notice It tests whether a setting name is already configured.
        @param settingName setting name to test.
        @return true if the setting is already configured. Otherwise it returns false.
     */
    function hasPlatformSetting(bytes32 settingName) external view returns (bool) {
        return _getPlatformSetting(settingName).exists;
    }

    /**
        @notice It pauses a specific lending pool.
        @param lendingPoolAddress lending pool address to pause.
     */
    function pauseLendingPool(address lendingPoolAddress)
        external
        onlyPauser()
        whenNotPaused()
        isInitialized()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(!lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_ALREADY_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = true;

        emit LendingPoolPaused(msg.sender, lendingPoolAddress);
    }

    /**
        @notice It unpauses a specific lending pool.
        @param lendingPoolAddress lending pool address to unpause.
     */
    function unpauseLendingPool(address lendingPoolAddress)
        external
        onlyPauser()
        whenNotPaused()
        isInitialized()
    {
        lendingPoolAddress.requireNotEmpty("LENDING_POOL_IS_REQUIRED");
        require(lendingPoolPaused[lendingPoolAddress], "LENDING_POOL_IS_NOT_PAUSED");

        lendingPoolPaused[lendingPoolAddress] = false;

        emit LendingPoolUnpaused(msg.sender, lendingPoolAddress);
    }

    /**
        @notice It gets whether the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function isPaused() external view returns (bool) {
        return paused();
    }

    /**
        @notice It creates a new asset settings in the platform.
        @param assetAddress asset address used to create the new setting.
        @param cTokenAddress cToken address used to configure the asset setting.
        @param maxLoanAmount the max loan amount used to configure the asset setting.
     */
    function createAssetSettings(
        address assetAddress,
        address cTokenAddress,
        uint256 maxLoanAmount
    ) external onlyPauser() isInitialized() {
        assetSettings[assetAddress].requireNotExists();
        assetSettings[assetAddress].initialize(maxLoanAmount);

        if (cTokenAddress.isNotEmpty()) {
            _setCTokenAddress(assetAddress, cTokenAddress);
        }

        assets.add(assetAddress);

        emit AssetSettingsCreated(msg.sender, assetAddress, cTokenAddress, maxLoanAmount);
    }

    /**
        @notice It removes all the asset settings for a specific asset address.
        @param assetAddress asset address used to remove the asset settings.
     */
    function removeAssetSettings(address assetAddress)
        external
        onlyPauser()
        isInitialized()
    {
        assetAddress.requireNotEmpty("ASSET_ADDRESS_IS_REQUIRED");
        assetSettings[assetAddress].requireExists();

        delete assetSettings[assetAddress];
        assets.remove(assetAddress);

        emit AssetSettingsRemoved(msg.sender, assetAddress);
    }

    /**
        @notice It updates the maximum loan amount for a specific asset address.
        @param assetAddress asset address to configure.
        @param newMaxLoanAmount the new maximum loan amount to configure.
     */
    function updateMaxLoanAmount(address assetAddress, uint256 newMaxLoanAmount)
        external
        onlyPauser()
        isInitialized()
    {
        uint256 oldMaxLoanAmount = assetSettings[assetAddress].maxLoanAmount;

        assetSettings[assetAddress].updateMaxLoanAmount(newMaxLoanAmount);

        emit AssetSettingsUintUpdated(
            MAX_LOAN_AMOUNT_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldMaxLoanAmount,
            newMaxLoanAmount
        );
    }

    /**
        @notice It updates the cToken address for a specific asset address.
        @param assetAddress asset address to configure.
        @param newCTokenAddress the new cToken address to configure.
     */
    function updateCTokenAddress(address assetAddress, address newCTokenAddress)
        external
        onlyPauser()
        isInitialized()
    {
        address oldCTokenAddress = assetSettings[assetAddress].cTokenAddress;

        _setCTokenAddress(assetAddress, newCTokenAddress);

        emit AssetSettingsAddressUpdated(
            CTOKEN_ADDRESS_ASSET_SETTING,
            msg.sender,
            assetAddress,
            oldCTokenAddress,
            newCTokenAddress
        );
    }

    /**
        @notice Tests whether amount exceeds the current maximum loan amount for a specific asset settings.
        @param assetAddress asset address to test the setting.
        @param amount amount to test.
        @return true if amount exceeds current max loan amout. Otherwise it returns false.
     */
    function exceedsMaxLoanAmount(address assetAddress, uint256 amount)
        external
        view
        returns (bool)
    {
        return assetSettings[assetAddress].exceedsMaxLoanAmount(amount);
    }

    /**
        @notice Gets the current asset addresses list.
        @return the asset addresses list.
     */
    function getAssets() external view returns (address[] memory) {
        return assets;
    }

    /**
        @notice Get the current asset settings for a given asset address.
        @param assetAddress asset address used to get the current settings.
        @return the current asset settings.
     */
    function getAssetSettings(address assetAddress)
        external
        view
        returns (AssetSettingsLib.AssetSettings memory)
    {
        return assetSettings[assetAddress];
    }

    /**
        @notice Gets the cToken address for a given asset address.
        @param assetAddress token address.
        @return the cToken address for a given asset address.
     */
    function getCTokenAddress(address assetAddress) external view returns (address) {
        return assetSettings[assetAddress].cTokenAddress;
    }

    /**
        @notice Requires an account to have the pauser role.
        @param account account to test.
     */
    function requirePauserRole(address account) public view {
        require(isPauser(account), "NOT_PAUSER");
    }

    /**
        @notice Restricts the use of the Teller protocol to authorized wallet addresses only
        @param restriction Bool turning the resitriction on or off
     */
    function restrictPlatform(bool restriction) external onlyPauser() isInitialized() {
        platformRestricted = restriction;
    }

    /**
        @notice Returns whether the platform is restricted or not
        @return bool True if the platform is restricted, false if not
     */
    function isPlatformRestricted() external view returns (bool) {
        return platformRestricted;
    }

    /**
        @notice Adds a wallet address to the list of authorized wallets
        @param addressToAdd The wallet address of the user being authorized
     */
    function addAuthorizedAddress(address addressToAdd)
        external
        onlyPauser()
        isInitialized()
    {
        addressToAdd.requireNotEmpty("ADDRESS_ZERO");
        authorizedAddresses[addressToAdd] = true;
    }

    /**
        @notice Removes a wallet address from the list of authorized wallets
        @param addressToRemove The wallet address of the user being unauthorized
     */
    function removeAuthorizedAddress(address addressToRemove)
        external
        onlyPauser()
        isInitialized()
    {
        addressToRemove.requireNotEmpty("ADDRESS_ZERO");
        authorizedAddresses[addressToRemove] = false;
    }

    /**
        @notice Tests whether an account has authorization
        @param account The account address to check for
        @return True if account has authorization, false if it does not
     */
    function hasAuthorization(address account) public view returns (bool) {
        return isPauser(account) || authorizedAddresses[account];
        versionsRegistry.isProxyRegistered(account);
    }

    /**
        @notice Requires an account to have platform authorization.
        @dev Checks if an account address has authorization or proxy contract is registered.
        @param account account to test.
     */
    function requireAuthorization(address account) public view {
        require(!platformRestricted || hasAuthorization(account), "NOT_AUTHORIZED");
    }

    /**
        @notice It initializes this settings contract instance.
        @param escrowFactoryAddress the initial escrow factory address.
        @param versionsRegistryAddress the initial versions registry address.
        @param chainlinkAggregatorAddress the initial pair aggregator registry address.
        @param marketsStateAddress the initial markets state address.
        @param interestValidatorAddress the initial interest validator address.
        @param atmSettingsAddress the initial ATM settings address.
        @param wethTokenAddress canonical WETH token address.
        @param cethTokenAddress compound CETH token address.
     */
    function initialize(
        address escrowFactoryAddress,
        address versionsRegistryAddress,
        address chainlinkAggregatorAddress,
        address marketsStateAddress,
        address interestValidatorAddress,
        address atmSettingsAddress,
        address wethTokenAddress,
        address cethTokenAddress
    ) external isNotInitialized() {
        require(escrowFactoryAddress.isContract(), "ESCROW_FACTORY_MUST_BE_CONTRACT");
        require(versionsRegistryAddress.isContract(), "VERS_REGISTRY_MUST_BE_CONTRACT");
        require(chainlinkAggregatorAddress.isContract(), "AGGREGATOR_MUST_BE_CONTRACT");
        require(marketsStateAddress.isContract(), "MARKETS_STATE_MUST_BE_CONTRACT");
        require(
            interestValidatorAddress.isEmpty() || interestValidatorAddress.isContract(),
            "INTEREST_VAL_MUST_BE_CONTRACT"
        );
        require(atmSettingsAddress.isContract(), "ATM_SETTINGS_MUST_BE_CONTRACT");
        require(cethTokenAddress.isContract(), "CETH_ADDRESS_MUST_BE_CONTRACT");

        Pausable.initialize(msg.sender);
        TInitializable._initialize();

        escrowFactory = IEscrowFactory(escrowFactoryAddress);
        versionsRegistry = ILogicVersionsRegistry(versionsRegistryAddress);
        chainlinkAggregator = IChainlinkAggregator(chainlinkAggregatorAddress);
        marketsState = IMarketsState(marketsStateAddress);
        interestValidator = IInterestValidator(interestValidatorAddress);
        atmSettings = IATMSettings(atmSettingsAddress);
        WETH_ADDRESS = wethTokenAddress;
        CETH_ADDRESS = cethTokenAddress;

        consts = new SettingsConsts();

        _setSettings(address(this));
    }

    /** Internal functions */

    /**
        @notice It gets the platform setting for a given setting name.
        @param settingName the setting name to look for.
        @return the current platform setting for the given setting name.
     */
    function _getPlatformSetting(bytes32 settingName)
        internal
        view
        returns (PlatformSettingsLib.PlatformSetting memory)
    {
        return platformSettings[settingName];
    }

    /**
        @notice It sets the cToken address for a specific asset address.
        @param assetAddress asset address to configure.
        @param cTokenAddress the new cToken address to configure.
     */
    function _setCTokenAddress(address assetAddress, address cTokenAddress) internal {
        if (assetAddress == ETH_ADDRESS) {
            // NOTE: This is the address for the cETH contract. It is hardcoded because the contract does not have a
            //       underlying() function on it to check that this is the correct contract.
            cTokenAddress.requireEqualTo(CETH_ADDRESS, "CETH_ADDRESS_NOT_MATCH");
        } else {
            require(assetAddress.isContract(), "ASSET_ADDRESS_MUST_BE_CONTRACT");
            if (cTokenAddress.isNotEmpty()) {
                require(cTokenAddress.isContract(), "CTOKEN_MUST_BE_CONTRACT_OR_EMPTY");
                require(
                    CErc20Interface(cTokenAddress).underlying() == assetAddress,
                    "UNDERLYING_ADDRESS_NOT_MATCH"
                );
            }
        }

        assetSettings[assetAddress].updateCTokenAddress(cTokenAddress);
    }

    /** Private functions */
}
