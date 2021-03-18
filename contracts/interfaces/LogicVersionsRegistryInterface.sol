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
interface LogicVersionsRegistryInterface {
    /**
        @notice This event is emitted when a new logic version is created.
        @param logicName new logic name.
        @param logic address where the logic is.
        @param version initial version for the logic address.
     */
    event LogicVersionCreated(
        bytes32 indexed logicName,
        address indexed logic,
        uint256 version
    );

    /**
        @notice This event is emitted when a logic version is rollbacked.
        @param logicName the logic name.
        @param oldLogic the old logic address.
        @param newLogic the new (or previous) logic address.
        @param oldVersion the old version.
        @param newVersion the new (previous) version.
     */
    event LogicVersionRollbacked(
        bytes32 indexed logicName,
        address oldLogic,
        address newLogic,
        uint256 oldVersion,
        uint256 newVersion
    );

    /**
        @notice This event is emitted when a new logic version is upgraded.
        @param logicName new logic name.
        @param oldLogic the old logic address.
        @param newLogic the new logic address.
        @param oldVersion the old version.
        @param newVersion the new version.
     */
    event LogicVersionUpgraded(
        bytes32 indexed logicName,
        address oldLogic,
        address newLogic,
        uint256 oldVersion,
        uint256 newVersion
    );

    /** External Functions */

    function consts() external returns (LogicVersionsConsts);

    /**
        @notice It creates multiple logic versions.
        @param newLogicVersions lists of the new logic versions to create.
     */
    function createLogicVersions(
        TellerCommon.CreateLogicVersionRequest[] calldata newLogicVersions
    ) external;

    /**
        @notice It upgrades multiple logic addresses.
        @param newLogicVersions lists of the new logic versions to create.
     */
    function upgradeLogicVersions(
        TellerCommon.UpgradeLogicVersionRequest[] calldata newLogicVersions
    ) external;

    /**
        @notice It upgrades a logic version given a logic name.
        @param logicName logic name to upgrade.
        @param newLogic the new logic address to set.
        @param proxy The (optional) DynamicUpgradeable proxy address to attempt to directly upgrade.
     */
    function upgradeLogicVersion(
        bytes32 logicName,
        address newLogic,
        address proxy
    ) external;

    /**
        @notice It rollbacks a logic to a previous version.
        @param logicName logic name to rollback.
        @param previousVersion the previous version to be used.
     */
    function rollbackLogicVersion(bytes32 logicName, uint256 previousVersion)
        external;

    /**
        @notice It gets the current logic version for a given logic name.
        @param logicName to get.
        @return the current logic version.
     */
    function getLogicVersion(bytes32 logicName)
        external
        view
        returns (
            uint256 currentVersion,
            uint256 latestVersion,
            address logic
        );

    /**
        @notice It tests whether a logic name is already configured.
        @param logicName logic name to test.
        @return true if the logic version is already configured. Otherwise it returns false.
     */
    function hasLogicVersion(bytes32 logicName) external view returns (bool);

    /**
        @notice It initializes this logic versions registry contract instance.
        @param aOwner address of the owner of the registry.
        @param initialLogicVersions lists of the new logic versions to create.
     */
    function initialize(
        address aOwner,
        TellerCommon.CreateLogicVersionRequest[] calldata initialLogicVersions
    ) external;
}
