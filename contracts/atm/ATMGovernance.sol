pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// External Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Common
import "../util/AddressArrayLib.sol";
import "../util/AddressLib.sol";
import "../base/TInitializable.sol";
import "./ATMCommon.sol";

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/access/roles/SignerRole.sol";
import "../base/BaseUpgradeable.sol";

// Interfaces
import "./IATMGovernance.sol";

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
    @notice This contract is used to modify Risk Settings, CRA or DataProviders for a specific ATM.

    @author develop@teller.finance
 */
contract ATMGovernance is IATMGovernance, TInitializable, SignerRole, BaseUpgradeable {
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    /* Constants */

    /* State Variables */

    // List of general ATM settings. We don't accept settings equal to zero.
    // Example: supplyToDebtRatio  => 5044 = percentage 50.44
    // Example: supplyToDebtRatio => 1 = percentage 00.01
    mapping(bytes32 => uint256) public generalSettings;

    // List of Market specific Asset settings on this ATM
    // Asset address => Asset setting name => Asset setting value
    // Example 1: USDC address => Risk Premium => 2500 (25%)
    // Example 2: DAI address => Risk Premium => 3500 (35%)
    mapping(address => mapping(bytes32 => uint256)) public assetMarketSettings;

    // List of ATM Data providers per data type
    mapping(uint8 => address[]) public dataProviders;

    // List of TLR rewards initialized with at least 1 value during ATMGovernance creation.
    ATMCommon.TLRReward[] public tlrRewards;

    // Unique CRA - Credit Risk Algorithm github hash to use in this ATM
    string public cra;

    /* External Functions */

    /**
        @notice Adds a new General Setting to this ATM.
        @param settingName name of the setting to be added.
        @param settingValue value of the setting to be added.
     */
    function addGeneralSetting(bytes32 settingName, uint256 settingValue)
        external
        onlySigner()
        isInitialized()
    {
        require(settingValue > 0, "GENERAL_SETTING_MUST_BE_POSITIVE");
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        require(generalSettings[settingName] == 0, "GENERAL_SETTING_ALREADY_EXISTS");
        generalSettings[settingName] = settingValue;
        emit GeneralSettingAdded(msg.sender, settingName, settingValue);
    }

    /**
        @notice Updates an existing General Setting on this ATM.
        @param settingName name of the setting to be modified.
        @param newValue new value to be set for this settingName. 
     */
    function updateGeneralSetting(bytes32 settingName, uint256 newValue)
        external
        onlySigner()
        isInitialized()
    {
        require(newValue > 0, "GENERAL_SETTING_MUST_BE_POSITIVE");
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        uint256 oldValue = generalSettings[settingName];
        require(oldValue != newValue, "GENERAL_SETTING_EQUAL_PREVIOUS");
        generalSettings[settingName] = newValue;
        emit GeneralSettingUpdated(msg.sender, settingName, oldValue, newValue);
    }

    /**
        @notice Removes a General Setting from this ATM.
        @param settingName name of the setting to be removed.
     */
    function removeGeneralSetting(bytes32 settingName)
        external
        onlySigner()
        isInitialized()
    {
        require(settingName != "", "GENERAL_SETTING_MUST_BE_PROVIDED");
        require(generalSettings[settingName] > 0, "GENERAL_SETTING_NOT_FOUND");
        uint256 previousValue = generalSettings[settingName];
        delete generalSettings[settingName];
        emit GeneralSettingRemoved(msg.sender, settingName, previousValue);
    }

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
    ) external onlySigner() isInitialized() {
        asset.requireNotEmpty("ASSET_ADDRESS_IS_REQUIRED");
        require(asset.isContract(), "ASSET_MUST_BE_A_CONTRACT");
        require(settingValue > 0, "ASSET_SETTING_MUST_BE_POSITIVE");
        require(settingName != "", "ASSET_SETTING_MUST_BE_PROVIDED");
        require(
            assetMarketSettings[asset][settingName] == 0,
            "ASSET_SETTING_ALREADY_EXISTS"
        );
        assetMarketSettings[asset][settingName] = settingValue;
        emit AssetMarketSettingAdded(msg.sender, asset, settingName, settingValue);
    }

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
    ) external onlySigner() isInitialized() {
        require(settingName != "", "ASSET_SETTING_MUST_BE_PROVIDED");
        require(assetMarketSettings[asset][settingName] > 0, "ASSET_SETTING_NOT_FOUND");
        require(
            newValue != assetMarketSettings[asset][settingName],
            "NEW_VALUE_SAME_AS_OLD"
        );
        uint256 oldValue = assetMarketSettings[asset][settingName];
        assetMarketSettings[asset][settingName] = newValue;
        emit AssetMarketSettingUpdated(
            msg.sender,
            asset,
            settingName,
            oldValue,
            newValue
        );
    }

    /**
        @notice Removes an existing Asset Setting from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be added.
     */
    function removeAssetMarketSetting(address asset, bytes32 settingName)
        external
        onlySigner()
        isInitialized()
    {
        require(settingName != "", "ASSET_SETTING_MUST_BE_PROVIDED");
        require(assetMarketSettings[asset][settingName] > 0, "ASSET_SETTING_NOT_FOUND");
        uint256 oldValue = assetMarketSettings[asset][settingName];
        delete assetMarketSettings[asset][settingName];
        emit AssetMarketSettingRemoved(msg.sender, asset, settingName, oldValue);
    }

    /**
        @notice Adds a new Data Provider on a specific Data Type array.
            This function would accept duplicated data providers for the same data type.
        @param dataTypeIndex array index for this Data Type.
        @param dataProvider data provider address.
     */
    function addDataProvider(uint8 dataTypeIndex, address dataProvider)
        external
        onlySigner()
        isInitialized()
    {
        require(dataProvider.isContract(), "DATA_PROVIDER_MUST_BE_A_CONTRACT");
        dataProviders[dataTypeIndex].add(dataProvider);
        uint256 amountDataProviders = dataProviders[dataTypeIndex].length;
        emit DataProviderAdded(
            msg.sender,
            dataTypeIndex,
            amountDataProviders,
            dataProvider
        );
    }

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
    ) external onlySigner() isInitialized() {
        require(
            dataProviders[dataTypeIndex].length > providerIndex,
            "DATA_PROVIDER_OUT_RANGE"
        );
        require(newProvider.isContract(), "DATA_PROVIDER_MUST_BE_A_CONTRACT");
        address oldProvider = dataProviders[dataTypeIndex][providerIndex];
        require(oldProvider != newProvider, "DATA_PROVIDER_SAME_OLD");
        dataProviders[dataTypeIndex][providerIndex] = newProvider;
        emit DataProviderUpdated(
            msg.sender,
            dataTypeIndex,
            providerIndex,
            oldProvider,
            newProvider
        );
    }

    /**
        @notice Removes an existing Data Provider on a specific Data Type array.
        @param dataTypeIndex array index for this Data Type.
        @param dataProviderIndex data provider index.
     */
    function removeDataProvider(uint8 dataTypeIndex, uint256 dataProviderIndex)
        external
        onlySigner()
        isInitialized()
    {
        require(
            dataProviders[dataTypeIndex].length > dataProviderIndex,
            "DATA_PROVIDER_OUT_RANGE"
        );
        address oldDataProvider = dataProviders[dataTypeIndex][dataProviderIndex];
        dataProviders[dataTypeIndex].removeAt(dataProviderIndex);
        emit DataProviderRemoved(
            msg.sender,
            dataTypeIndex,
            dataProviderIndex,
            oldDataProvider
        );
    }

    /**
        @notice Sets the CRA - Credit Risk Algorithm to be used on this specific ATM.
                CRA is represented by a Github commit hash of the newly proposed algorithm.
        @param _cra Credit Risk Algorithm github commit hash.
     */
    function setCRA(string calldata _cra) external onlySigner() isInitialized() {
        bytes memory tempEmptyStringTest = bytes(_cra);
        require(tempEmptyStringTest.length > 0, "CRA_CANT_BE_EMPTY");
        require(
            keccak256(abi.encodePacked(cra)) != keccak256(abi.encodePacked(_cra)),
            "CRA_SAME_AS_OLD"
        );
        cra = _cra;
        emit CRASet(msg.sender, cra);
    }

    /**
        @notice Adds a new TLR Reward value effective immediately since current block.
     */
    function addTLRReward(uint256 rewardAmount) external onlySigner() isInitialized() {
        ATMCommon.TLRReward memory latestReward = tlrRewards[tlrRewards.length - 1];
        require(
            latestReward.tlrPerBlockPertToken != rewardAmount,
            "PREVIOUS_AND_NEW_VALUE_ARE_EQUAL"
        );
        require(
            latestReward.startBlockNumber < block.number,
            "TLR_REWARD_ALREADY_SET_FOR_BLOCK"
        );
        tlrRewards.push(
            ATMCommon.TLRReward({
                startBlockNumber: block.number,
                tlrPerBlockPertToken: rewardAmount
            })
        );
        emit TLRRewardAdded(msg.sender, tlrRewards.length, block.number, rewardAmount);
    }

    /**
        @notice It initializes this ATM Governance instance.
        @param settingsAddress the initial settings address.
        @param ownerAddress the owner address for this ATM Governance.
        @param tlrInitialReward TLR initial reward set on Liquidity mining program associated with this ATM.
     */
    function initialize(
        address settingsAddress,
        address ownerAddress,
        uint256 tlrInitialReward
    ) external isNotInitialized() {
        _setSettings(settingsAddress);

        SignerRole.initialize(ownerAddress);
        TInitializable._initialize();
        ATMCommon.TLRReward memory setupReward = ATMCommon.TLRReward({
            startBlockNumber: block.number,
            tlrPerBlockPertToken: tlrInitialReward
        });
        tlrRewards.push(setupReward);
    }

    /* External Constant functions */

    /**
        @notice Returns a General Setting value from this ATM.
        @param settingName name of the setting to be returned.
     */
    function getGeneralSetting(bytes32 settingName) external view returns (uint256) {
        return generalSettings[settingName];
    }

    /**
        @notice Returns an existing Asset Setting value from a specific Market on this ATM.
        @param asset market specific asset address.
        @param settingName name of the setting to be returned.
     */
    function getAssetMarketSetting(address asset, bytes32 settingName)
        external
        view
        returns (uint256)
    {
        return assetMarketSettings[asset][settingName];
    }

    /**
        @notice Returns a Data Provider on a specific Data Type array.
        @param dataTypeIndex array index for this Data Type.
        @param dataProviderIndex data provider index number.
     */
    function getDataProvider(uint8 dataTypeIndex, uint256 dataProviderIndex)
        external
        view
        returns (address)
    {
        if (dataProviders[dataTypeIndex].length > dataProviderIndex) {
            return dataProviders[dataTypeIndex][dataProviderIndex];
        }
        return address(0x0);
    }

    /**
        @notice Returns current CRA - Credit Risk Algorithm that is being used on this specific ATM.
                CRA is represented by a Github commit hash of the newly proposed algorithm.
     */
    function getCRA() external view returns (string memory) {
        return cra;
    }

    /**
        @notice Returns the complete list of rewards used on this ATM instance.
     */
    function getTLRRewards() external view returns (ATMCommon.TLRReward[] memory) {
        return tlrRewards;
    }
}
