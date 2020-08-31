pragma solidity 0.5.17;

// Interfaces
import "../interfaces/SettingsInterface.sol";

/**
    @notice It is the base contract to hold the settings instance and upgradeable logic name in registry.

    @author develop@teller.finance
 */
contract BaseUpgradeable {
    using Address for address;

    /** State Variables **/

    bytes32 internal constant SETTINGS_SLOT = keccak256("BaseUpgradeable.settings");
    bytes32 internal constant LOGIC_NAME_SLOT = keccak256("BaseUpgradeable.logicName");

    /** Modifiers **/

    modifier onlyPauser() {
        settings().requirePauserRole(msg.sender);
        _;
    }

    /** Public Functions **/

    /**
        @notice The settings contract.
     */
    // TODO: remove in sub contracts' initializers since it will already be set in the proxy
    function settings() public view returns (SettingsInterface) {
        address settingsAddress;

        bytes32 slot = SETTINGS_SLOT;
        assembly {
            settingsAddress := sload(slot)
        }

        return SettingsInterface(settingsAddress);
    }

    /** Internal Functions **/

    // TODO Verify OpenZeppeling impl. It mustn't change over the time.
    function logicName() internal view returns (bytes32 name) {
        bytes32 slot = LOGIC_NAME_SLOT;
        assembly {
            name := sload(slot)
        }
    }

    function _setSettings(address settingsAddress) internal {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        bytes32 slot = SETTINGS_SLOT;
        assembly {
            sstore(slot, settingsAddress)
        }
    }

    function _setLogicName(bytes32 aLogicName) internal {
        require(settings().versionsRegistry().hasLogicVersion(aLogicName), "LOGIC_NAME_NOT_EXIST");

        bytes32 slot = LOGIC_NAME_SLOT;
        assembly {
            sstore(slot, aLogicName)
        }
    }
}

