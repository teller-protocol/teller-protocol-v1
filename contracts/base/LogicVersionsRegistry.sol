pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseUpgradeable.sol";
import "./TInitializable.sol";

// Commons and Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../util/AddressLib.sol";
import "../util/LogicVersionLib.sol";
import "../util/LogicVersionsConsts.sol";
import "../util/TellerCommon.sol";

// Interfaces
import "../interfaces/ILogicVersionsRegistry.sol";
import "../interfaces/IBaseProxy.sol";

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
    @notice It manages all the logic contract versions, mapping each one to a logic name (or key).

    @author develop@teller.finance
 */
contract LogicVersionsRegistry is
    ILogicVersionsRegistry,
    TInitializable,
    BaseUpgradeable
{
    using LogicVersionLib for LogicVersionLib.LogicVersion;
    using Address for address;

    /** Constants */

    /* State Variables */

    LogicVersionsConsts public consts;

    /**
        @notice It represents a mapping to identify a logic name (key) and the current logic address and version.

        i.e.:
            bytes32("EtherCollateralLoans") => { logic: "0x123...789", version: 1 }.
            bytes32("LendingPool") => { logic: "0x456...987", version: 3 }.
     */
    mapping(bytes32 => LogicVersionLib.LogicVersion) internal logicVersions;

    /**
        @notice It keeps a record of all the proxies that are registered in the platform.
      */
    mapping(address => bool) internal registeredProxies;

    /** Modifiers */

    /* Constructor */

    /** External Functions */

    /**
        @notice It creates a new logic version given a logic name and address.
        @param logicName logic name to create.
        @param logic the logic address value for the given logic name.
     */
    function createLogicVersion(bytes32 logicName, address logic)
        external
        onlyPauser()
        isInitialized()
    {
        _createLogicVersion(logicName, logic);
    }

    /**
        @notice It creates multiple logic versions.
        @param newLogicVersions lists of the new logic versions to create.
     */
    function createLogicVersions(
        TellerCommon.LogicVersionRequest[] calldata newLogicVersions
    ) external onlyPauser() isInitialized() {
        require(newLogicVersions.length > 0, "REQUEST_LIST_EMPTY");

        for (uint256 index; index < newLogicVersions.length; index++) {
            _createLogicVersion(
                newLogicVersions[index].logicName,
                newLogicVersions[index].logic
            );
        }
    }

    /**
        @notice It update a current logic address given a logic name.
        @param logicName logic name to update.
        @param newLogic the new logic address to set.
     */
    function updateLogicAddress(bytes32 logicName, address newLogic)
        external
        onlyPauser()
        isInitialized()
    {
        (
            address oldLogic,
            uint256 oldVersion,
            uint256 newVersion
        ) = logicVersions[logicName].update(newLogic);

        emit LogicVersionUpdated(
            logicName,
            msg.sender,
            oldLogic,
            newLogic,
            oldVersion,
            newVersion
        );
    }

    /**
        @notice It removes a current logic version given a logic name.
        @param logicName logic name to remove.
     */
    function removeLogicVersion(bytes32 logicName) external onlyPauser() isInitialized() {
        (address lastLogic, uint256 lastVersion) = logicVersions[logicName].remove();

        emit LogicVersionRemoved(logicName, msg.sender, lastLogic, lastVersion);
    }

    /**
        @notice It gets the current logic version for a given logic name.
        @param logicName to get.
        @return the current logic version.
     */
    function getLogicVersion(bytes32 logicName)
        external
        view
        returns (LogicVersionLib.LogicVersion memory)
    {
        return _getLogicVersion(logicName);
    }

    /**
        @notice It gets the current logic address for a given logic name.
        @param logicName to get.
        @return the current logic address.
     */
    function getLogicVersionAddress(bytes32 logicName) external view returns (address) {
        return _getLogicVersion(logicName).logic;
    }

    /**
        @notice It tests whether a logic name is already configured.
        @param logicName logic name to test.
        @return true if the logic version is already configured. Otherwise it returns false.
     */
    function hasLogicVersion(bytes32 logicName) external view returns (bool) {
        return _getLogicVersion(logicName).exists;
    }

    /**
        @notice Checks if an address is registered as a platform proxy.
        @param proxy Address to check if is registered.
        @return boolean if registered or not
      */
    function isProxyRegistered(address proxy) external view returns (bool) {
        (, bytes memory returnData) = proxy.staticcall(
            abi.encodeWithSignature("logicName()")
        );
        if (returnData.length > 0) {
            bytes32 logicName = abi.decode(returnData, (bytes32));
            return proxy == _getLogicVersion(logicName).logic;
        }

        return false;
    }

    /**
        @notice It initializes this logic versions registry contract instance.
        @param settingsAddress the settings contract address.
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        _initialize();

        _setSettings(settingsAddress);
        consts = new LogicVersionsConsts();
    }

    /** Internal functions */

    /**
        @notice It gets the logic version for a given logic name.
        @param logicName the logic name to look for.
        @return the current logic version for the given logic name.
     */
    function _getLogicVersion(bytes32 logicName)
        internal
        view
        returns (LogicVersionLib.LogicVersion memory)
    {
        return logicVersions[logicName];
    }

    /**
        @notice It creates a new logic version given a logic name and address.
        @param logicName logic name to create.
        @param logic the logic address value for the given logic name.
     */
    function _createLogicVersion(bytes32 logicName, address logic) internal {
        require(logicName != "", "LOGIC_NAME_MUST_BE_PROVIDED");
        logicVersions[logicName].initialize(logic);

        emit LogicVersionCreated(logicName, msg.sender, logic, 0);
    }

    /** Private functions */
}
