pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";
import "./BaseDynamic.sol";


/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseDynamic to get access to the settings.

    @author develop@teller.finance
 */
contract DynamicProxy is BaseProxy, BaseDynamic {
    /**
        @notice It creates a new dynamic proxy given a settings contract and a logic name.
        @param settingsAddress the settings contract address.
     */
    constructor(address settingsAddress, bytes32 aLogicName)
        public
        payable // TODO Why is it payable?
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        settings = SettingsInterface(settingsAddress);

        require(settings.versionsRegistry().hasLogicVersion(aLogicName), "LOGIC_NAME_NOT_EXIST");
        logicName = aLogicName;
    }

    /** Internal Functions **/

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return settings.versionsRegistry().getLogicVersionAddress(logicName);
    }
}
