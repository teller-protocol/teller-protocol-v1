pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../util/AddressLib.sol";
import "../util/PlatformSettingsLib.sol";
import "../util/AddressArrayLib.sol";
import "../util/CacheLib.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "../util/SettingsConsts.sol";
import "./BaseUpgradeable.sol";
import "./TInitializable.sol";
import "./UpgradeableProxy.sol";
import "./DynamicProxy.sol";
import "./AssetSettings.sol";
import "./LogicVersionsRegistry.sol";
import "./EscrowFactory.sol";
import "../providers/chainlink/ChainlinkAggregator.sol";

// Interfaces
import "../interfaces/SettingsInterface.sol";
import "../interfaces/EscrowFactoryInterface.sol";
import "../providers/chainlink/IChainlinkAggregator.sol";
import "../providers/compound/CErc20Interface.sol";
import "../interfaces/AssetSettingsInterface.sol";
import "../interfaces/MarketFactoryInterface.sol";

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
    @dev The platform settings functions (create, update, and remove) don't include the whenNotPaused()
    modifier because we might need to use them in both cases (when the platform is paused and not paused).
        Example:
            - There is a potential issue and before analyzing it, we pause the platform to avoid funds losses.
            Finally, as result of the analysis, we decided to update a platform setting (or create a new one for the
            cloud nodes). In this scenario, if the modifier is present, we couldn't update the setting
            (because the platform is paused).

    @author develop@teller.finance
 */
contract Settings is
    SettingsInterface,
    TInitializable,
    Pausable,
    BaseUpgradeable
{
    using AddressLib for address;
    using Address for address;
    using AddressArrayLib for address[];
    using PlatformSettingsLib for PlatformSettingsLib.PlatformSetting;

    /** Constants */

    /**
        @notice The contract that holds global constant variables.
        @dev It is set by the initialize function.
     */
    SettingsConsts public consts;

    /**
        @notice It defines the constant address to represent ETHER.
     */
    address public constant ETH_ADDRESS =
        0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;

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

    /**
        @notice It is the global instance of the AssetSettings contract.
     */
    AssetSettingsInterface public assetSettings;

    /**
        @notice This mapping represents the platform settings where:

        - The key is the platform setting name.
        - The value is the platform setting. It includes the value, minimum and maximum values.
     */
    mapping(bytes32 => PlatformSettingsLib.PlatformSetting)
        public platformSettings;

    /**
        @notice It is the global instance of the EscrowFactory contract.
     */
    EscrowFactoryInterface public escrowFactory;

    /**
        @notice It is the global instance of the logic versions registry contract.
     */
    LogicVersionsRegistryInterface public versionsRegistry;

    /**
        @notice It is the global instance of the ChainlinkAggregator contract.
     */
    IChainlinkAggregator public chainlinkAggregator;

    /**
        @notice It is the global instance of the MarketFactory contract.
     */
    MarketFactoryInterface public marketFactory;

    /**
        @notice This mapping represents the list of wallet addresses that are allowed to interact with the protocol

        - The key is belongs to the user's wallet address
        - The value is a boolean flag indicating if the address has permissions
     */
    mapping(address => bool) public authorizedAddresses;

    /**
        @notice Flag restricting the use of the Protocol to authorizedAddress
     */
    bool public platformRestricted;

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

        emit PlatformSettingCreated(
            settingName,
            msg.sender,
            value,
            minValue,
            maxValue
        );
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

        emit PlatformSettingUpdated(
            settingName,
            msg.sender,
            oldValue,
            newValue
        );
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
    function hasPlatformSetting(bytes32 settingName)
        external
        view
        returns (bool)
    {
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
        require(
            !lendingPoolPaused[lendingPoolAddress],
            "LENDING_POOL_ALREADY_PAUSED"
        );

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
        require(
            lendingPoolPaused[lendingPoolAddress],
            "LENDING_POOL_IS_NOT_PAUSED"
        );

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
        return assetSettings.exceedsMaxLoanAmount(assetAddress, amount);
    }

    /**
        @notice Gets the cToken address for a given asset address.
        @param assetAddress token address.
        @return the cToken address for a given asset address.
     */
    function getCTokenAddress(address assetAddress)
        external
        view
        returns (address)
    {
        return assetSettings.getCTokenAddress(assetAddress);
    }

    /**
        @notice Requires an account to have the pauser role.
        @param account account to test.
     */
    function requirePauserRole(address account) public view {
        require(isPauser(account) || account == address(this), "NOT_PAUSER");
    }

    /**
        @notice Restricts the use of the Teller protocol to authorized wallet addresses only
        @param restriction Bool turning the resitriction on or off
     */
    function restrictPlatform(bool restriction)
        external
        onlyPauser()
        isInitialized()
    {
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
    function addAuthorizedAddress(address addressToAdd) public isInitialized() {
        require(
            isPauser(msg.sender) || msg.sender == address(escrowFactory),
            "CALLER_NOT_PAUSER"
        );
        authorizedAddresses[addressToAdd] = true;
    }

    /**
        @notice Adds a list of wallet addresses to the list of authorized wallets
        @param addressesToAdd The list of wallet addresses being authorized
     */
    function addAuthorizedAddressList(address[] calldata addressesToAdd)
        external
        isInitialized()
    {
        for (uint256 i = 0; i < addressesToAdd.length; i++) {
            addAuthorizedAddress(addressesToAdd[i]);
        }
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
        authorizedAddresses[addressToRemove] = false;
    }

    /**
        @notice Tests whether an account has authorization
        @param account The account address to check for
        @return True if account has authorization, false if it does not
     */
    function hasAuthorization(address account) public view returns (bool) {
        return
            isPauser(account) ||
            authorizedAddresses[account] ||
            versionsRegistry.isProxyRegistered(account);
    }

    /**
        @notice Requires an account to have platform authorization.
        @dev Checks if an account address has authorization or proxy contract is registered.
        @param account account to test.
     */
    function requireAuthorization(address account) public view {
        require(
            !platformRestricted || hasAuthorization(account),
            "NOT_AUTHORIZED"
        );
    }

    /**
        @notice It initializes this settings contract instance.
        @param versionsRegistryLogicAddress LogicVersionsRegistry logic address.
        @param wethTokenAddress canonical WETH token address.
        @param cethTokenAddress compound CETH token address.
     */
    function initialize(
        address versionsRegistryLogicAddress,
        address wethTokenAddress,
        address cethTokenAddress
    ) external isNotInitialized() {
        require(cethTokenAddress.isContract(), "CETH_ADDRESS_MUST_BE_CONTRACT");

        Pausable.initialize(msg.sender);
        TInitializable._initialize();

        WETH_ADDRESS = wethTokenAddress;
        CETH_ADDRESS = cethTokenAddress;

        consts = new SettingsConsts();

        _setSettings(address(this));

        UpgradeableProxy logicVersionsRegistryProxy = new UpgradeableProxy();
        logicVersionsRegistryProxy.initializeProxy(
            address(this),
            versionsRegistryLogicAddress
        );
        versionsRegistry = LogicVersionsRegistryInterface(
            address(logicVersionsRegistryProxy)
        );
        versionsRegistry.initialize();
        assetSettings = AssetSettingsInterface(
            _deployDynamicProxy(
                versionsRegistry.consts().ASSET_SETTINGS_LOGIC_NAME()
            )
        );
        chainlinkAggregator = IChainlinkAggregator(
            _deployDynamicProxy(
                versionsRegistry.consts().CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME()
            )
        );
        escrowFactory = EscrowFactoryInterface(
            _deployDynamicProxy(
                versionsRegistry.consts().ESCROW_FACTORY_LOGIC_NAME()
            )
        );
        marketFactory = MarketFactoryInterface(
            _deployDynamicProxy(
                versionsRegistry.consts().MARKET_FACTORY_LOGIC_NAME()
            )
        );
    }

    function postLogicVersionsRegistered() external {
        chainlinkAggregator.initialize();
        escrowFactory.initialize();
        marketFactory.initialize();
    }

    /** Internal functions */

    function _deployDynamicProxy(bytes32 logicName) internal returns (address) {
        return address(new DynamicProxy(address(this), logicName));
    }

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
}
