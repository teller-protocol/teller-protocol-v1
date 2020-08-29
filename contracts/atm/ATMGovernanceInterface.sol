pragma solidity 0.5.17;

import "../interfaces/SettingsInterface.sol";

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
    @notice This interface defines available functions for an ATMGovernace.

    @author develop@teller.finance
 */
interface ATMGovernanceInterface {
    /* Events */

    /**
        @notice Emitted when a new ATM General Setting was added.
        @param sender transaction sender address.
        @param settingName name of the newly added setting.
        @param settingValue value of the newly added setting.  
     */
    event GeneralSettingAdded(
        address indexed sender,
        bytes32 indexed settingName,
        uint256 settingValue
    );

    /**
        @notice Emitted when an ATM General Setting was updated.
        @param sender transaction sender address.
        @param settingName name of the newly added setting.
        @param oldValue previous value of this setting.  
        @param newValue new value of this setting.  
     */
    event GeneralSettingUpdated(
        address indexed sender,
        bytes32 indexed settingName,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice Emitted when an ATM General Setting was removed.
        @param sender transaction sender address.
        @param settingName name of the setting removed.
        @param settingValue value of the setting removed.  
     */
    event GeneralSettingRemoved(
        address indexed sender,
        bytes32 indexed settingName,
        uint256 settingValue
    );

    /**
        @notice Emitted when a new Asset Setting was added for an specific Market.
        @param sender transaction sender address.
        @param asset asset address this setting was created for.
        @param settingName name of the added setting.
        @param settingValue value of the added setting.
     */
    event AssetMarketSettingAdded(
        address indexed sender,
        address indexed asset,
        bytes32 indexed settingName,
        uint256 settingValue
    );

    /**
        @notice Emitted when an Asset Setting was updated for an specific Market.
        @param sender transaction sender address.
        @param asset asset address this setting was updated for.
        @param settingName name of the updated setting.
        @param oldValue previous value of this setting.
        @param newValue new value of this setting.
     */
    event AssetMarketSettingUpdated(
        address indexed sender,
        address indexed asset,
        bytes32 indexed settingName,
        uint256 oldValue,
        uint256 newValue
    );

    /**
        @notice Emitted when an Asset Setting was removed for an specific Market.
        @param sender transaction sender address.
        @param asset asset address this setting was removed for.
        @param settingName name of the removed setting.
        @param oldValue previous value of the removed setting.
     */
    event AssetMarketSettingRemoved(
        address indexed sender,
        address indexed asset,
        bytes32 indexed settingName,
        uint256 oldValue
    );

    /**
        @notice Emitted when a new Data Provider was added to this ATM.
        @param sender transaction sender address.
        @param dataTypeIndex index of this data type.
        @param amountDataProviders amount of data providers for this data type.
        @param dataProvider address of the added Data Provider.
     */
    event DataProviderAdded(
        address indexed sender,
        uint8 indexed dataTypeIndex,
        uint256 amountDataProviders,
        address dataProvider
    );

    /**
        @notice Emitted when a Data Provider was updated on this ATM.
        @param sender transaction sender address.
        @param dataTypeIndex index of this data type.
        @param dataProviderIndex index of this data provider.
        @param oldDataProvider previous address of the Data Provider.
        @param newDataProvider new address of the Data Provider.
     */
    event DataProviderUpdated(
        address indexed sender,
        uint8 indexed dataTypeIndex,
        uint256 indexed dataProviderIndex,
        address oldDataProvider,
        address newDataProvider
    );

    /**
        @notice Emitted when a Data Provider was removed on this ATM.
        @param sender transaction sender address.
        @param dataTypeIndex index of this data type.
        @param dataProviderIndex index of this data provider inside this data type.
        @param dataProvider address of the Data Provider.
     */
    event DataProviderRemoved(
        address indexed sender,
        uint8 indexed dataTypeIndex,
        uint256 indexed dataProviderIndex,
        address dataProvider
    );

    /**
        @notice Emitted when a new CRA - Credit Risk Algorithm is set.
        @param sender transaction sender address.
        @param craCommitHash github commit hash with the new CRA implementation.
     */
    event CRASet(address indexed sender, string craCommitHash);

    /* External Functions */

    /**
        @notice Adds a new General Setting to this ATM.
        @param settingName name of the setting to be added.
        @param settingValue value of the setting to be added.
     */
    function addGeneralSetting(bytes32 settingName, uint256 settingValue) external;

    /**
        @notice Updates an existing General Setting on this ATM.
        @param settingName name of the setting to be modified.
        @param newValue new value to be set for this settingName. 
     */
    function updateGeneralSetting(bytes32 settingName, uint256 newValue) external;

    /**
        @notice Removes a General Setting from this ATM.
        @param settingName name of the setting to be removed.
     */
    function removeGeneralSetting(bytes32 settingName) external;

    /**
        @notice Adds a new Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
        @param settingValue value of the setting to be added.
     */
    function addAssetMarketSetting(
        address asset,
        bytes32 settingName,
        uint256 settingValue
    ) external;

    /**
        @notice Updates an existing Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
        @param newValue value of the setting to be added.
     */
    function updateAssetMarketSetting(
        address asset,
        bytes32 settingName,
        uint256 newValue
    ) external;

    /**
        @notice Removes an existing Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
     */
    function removeAssetMarketSetting(address asset, bytes32 settingName) external;

    /**
        @notice Adds a new Data Provider on a specific Data Type array.
            This function would accept duplicated data providers for the same data type.
        @param dataTypeIndex array index for this Data Type.
        @param dataProvider data provider address.
     */
    function addDataProvider(uint8 dataTypeIndex, address dataProvider) external;

    /**
        @notice Updates an existing Data Provider on a specific Data Type array.
        @param dataTypeIndex array index for this Data Type.
        @param providerIndex previous data provider index.
        @param newProvider new data provider address.
     */
    function updateDataProvider(
        uint8 dataTypeIndex,
        uint256 providerIndex,
        address newProvider
    ) external;

    /**
        @notice Removes an existing Data Provider on a specific Data Type array.
        @param dataTypeIndex array index for this Data Type.
        @param dataProvider data provider index.
     */
    function removeDataProvider(uint8 dataTypeIndex, uint256 dataProvider) external;

    /**
        @notice Sets the CRA - Credit Risk Algorithm to be used on this specific ATM.
                CRA is represented by a Github commit hash of the newly proposed algorithm.
     */
    function setCRA(string calldata cra) external;

    /* External Constant functions */

    /**
        @notice Returns a General Setting value from this ATM.
        @param settingName name of the setting to be returned.
     */
    function getGeneralSetting(bytes32 settingName) external view returns (uint256);

    /**
        @notice Returns an existing Asset Setting value from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be returned.
     */
    function getAssetMarketSetting(address asset, bytes32 settingName)
        external
        view
        returns (uint256);

    /**
        @notice Returns a Data Provider on a specific Data Type array.
        @param dataTypeIndex array index for this Data Type.
        @param dataProviderIndex data provider index number.
     */
    function getDataProvider(uint8 dataTypeIndex, uint256 dataProviderIndex)
        external
        view
        returns (address);

    /**
        @notice Returns current CRA - Credit Risk Algorithm that is being used on this specific ATM.
                CRA is represented by a Github commit hash of the newly proposed algorithm.
     */
    function getCRA() external view returns (string memory);

    function settings() external view returns (SettingsInterface);

    /**
        @notice It initializes this ATM Governance instance.
        @param settingsAddress the initial settings address.
        @param ownerAddress the owner address for this ATM Governance.
     */
    function initialize(address settingsAddress, address ownerAddress) external;
}
