pragma solidity 0.5.17;

// Libraries
import "../util/AddressLib.sol";

// Interfaces
import "../interfaces/ISettings.sol";
import "../interfaces/IBaseUpgradeable.sol";

/**
    @notice It is the base contract to hold the settings instance and upgradeable logic name in registry.

    @author develop@teller.finance
 */
contract BaseUpgradeable is IBaseUpgradeable {
    using Address for address;
    using AddressLib for address;

    /** State Variables **/

    /**
        @notice It defines the slot where the settings contract address will be stored.
     */
    bytes32 internal constant SETTINGS_SLOT = bytes32(
        uint256(keccak256("BaseUpgradeable.settings")) - 1
    );
    /**
        @notice It defines the slot where the logic name will be stored.
     */
    bytes32 internal constant LOGIC_NAME_SLOT = bytes32(
        uint256(keccak256("BaseUpgradeable.logicName")) - 1
    );

    /** Modifiers **/

    /**
        @notice Checks if sender has a pauser role
        @dev Throws an error if the sender has not a pauser role.
     */
    modifier onlyPauser() {
        _getSettings().requirePauserRole(msg.sender);
        _;
    }

    /** Public Functions **/

    /**
        @notice The gets the settings contract address from the SETTINGS_SLOT.
        @dev This address should NOT change over the time. See details in the _setSettings(...) function.
     */
    function settings() external view returns (ISettings) {
        return _getSettings();
    }

    /**
        @notice It represent the current logic name (key) for the current implementation.
        @dev It is used by LogicVersionsRegistry to get the logic address for the given logic name.
        @dev It must NOT change over the time.
        @dev The logic is equal to the OpenZeppelin
        @return the logic name.
     */
    function logicName() internal view returns (bytes32 name) {
        bytes32 slot = LOGIC_NAME_SLOT;
        assembly {
            name := sload(slot)
        }
    }

    /** Internal Functions **/

    function _getSettings() internal view returns (ISettings) {
        address settingsAddress;

        bytes32 slot = SETTINGS_SLOT;
        assembly {
            settingsAddress := sload(slot)
        }

        return ISettings(settingsAddress);
    }

    /**
        @notice It sets the settings contract address for this contract instance.
        @dev As the settings must NOT change over the time, it verifies if it is already set before updating it.
        @param settingsAddress the settings address to be used for this upgradeable contract.
     */
    function _setSettings(address settingsAddress) internal {
        // Prevent resetting the settings logic for standalone test deployments.
        if (address(_getSettings()).isNotEmpty()) {
            return;
        }
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        bytes32 slot = SETTINGS_SLOT;
        assembly {
            sstore(slot, settingsAddress)
        }
    }

    /**
        @notice It sets the logic name for this contract instance.
        @dev As the logic name must NOT change over the time, it verifies if it is already set before updating it.
        @dev It verifies if the logic name exists in the LogicVersionsRegistry.
        @param aLogicName the logic name to be used for this upgradeable contract.
     */
    function _setLogicName(bytes32 aLogicName) internal {
        // Prevent resetting the logic name for standalone test deployments.
        require(logicName() == "", "LOGIC_NAME_ALREADY_SET");
        require(
            _getSettings().versionsRegistry().hasLogicVersion(aLogicName),
            "LOGIC_NAME_NOT_EXIST"
        );

        bytes32 slot = LOGIC_NAME_SLOT;
        assembly {
            sstore(slot, aLogicName)
        }
    }
}
