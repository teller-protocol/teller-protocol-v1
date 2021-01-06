pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Commons
import "../util/LogicVersionLib.sol";
import "../util/LogicVersionsConsts.sol";
import "../util/TellerCommon.sol";

/**
    @notice It defines all the functions to manage the logic contract versions.

    @author develop@teller.finance
 */
interface ILogicVersionsRegistry {
    /**
        @notice This event is emitted when a new logic version is created.
        @param logicName new logic name.
        @param sender address that created it.
        @param logic address where the logic is.
        @param version initial version for the logic address.
     */
    event LogicVersionCreated(
        bytes32 indexed logicName,
        address indexed sender,
        address indexed logic,
        uint256 version
    );

    /**
        @notice This event is emitted when a current logic version is removed.
        @param logicName new logic name.
        @param sender address that removed it.
        @param lastLogic last logic address where the logic was.
        @param lastVersion last version for the logic address.
     */
    event LogicVersionRemoved(
        bytes32 indexed logicName,
        address indexed sender,
        address lastLogic,
        uint256 lastVersion
    );

    /**
        @notice This event is emitted when a new logic version is updated.
        @param logicName new logic name.
        @param sender address that updated it.
        @param oldLogic the old logic address.
        @param newLogic the new logic address.
        @param oldVersion the old version.
        @param newVersion the new version.
     */
    event LogicVersionUpdated(
        bytes32 indexed logicName,
        address indexed sender,
        address oldLogic,
        address newLogic,
        uint256 oldVersion,
        uint256 newVersion
    );

    /** External Functions */

    function consts() external returns (LogicVersionsConsts);

    /**
        @notice It creates a new logic version given a logic name and address.
        @param logicName logic name to create.
        @param logic the logic address value for the given logic name.
     */
    function createLogicVersion(bytes32 logicName, address logic) external;

    /**
        @notice It creates multiple logic versions.
        @param newLogicVersions lists of the new logic versions to create.
     */
    function createLogicVersions(
        TellerCommon.LogicVersionRequest[] calldata newLogicVersions
    ) external;

    /**
        @notice It update a current logic address given a logic name.
        @param logicName logic name to update.
        @param newLogic the new logic address to set.
     */
    function updateLogicAddress(bytes32 logicName, address newLogic) external;

    /**
        @notice It removes a current logic version given a logic name.
        @param logicName logic name to remove.
     */
    function removeLogicVersion(bytes32 logicName) external;

    /**
        @notice It gets the current logic version for a given logic name.
        @param logicName to get.
        @return the current logic version.
     */
    function getLogicVersion(bytes32 logicName)
        external
        view
        returns (LogicVersionLib.LogicVersion memory);

    /**
        @notice It gets the current logic address for a given logic name.
        @param logicName to get.
        @return the current logic address.
     */
    function getLogicVersionAddress(bytes32 logicName) external view returns (address);

    /**
        @notice It tests whether a logic name is already configured.
        @param logicName logic name to test.
        @return true if the logic version is already configured. Otherwise it returns false.
     */
    function hasLogicVersion(bytes32 logicName) external view returns (bool);

    /**
        @notice Checks if an address is registered as a platform proxy.
        @param proxy Address to check if is registered.
        @return boolean if registered or not
      */
    function isProxyRegistered(address proxy) external view returns (bool);

    /**
        @notice It initializes this logic versions registry contract instance.
        @param settingsAddress the settings contract address.
     */
    function initialize(address settingsAddress) external;
}
