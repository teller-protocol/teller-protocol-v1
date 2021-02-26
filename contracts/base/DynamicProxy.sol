pragma solidity 0.5.17;

// Contracts
import "./BaseDynamicProxy.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract DynamicProxy is BaseDynamicProxy {
    /**
        @notice It creates a new dynamic proxy given a settings contract and a logic name.
        @param settingsAddress the settings contract address.
        @param aLogicName the logic name to set.
     */
    constructor(address settingsAddress, bytes32 aLogicName) public {
        _setSettings(settingsAddress);
        _setLogicName(aLogicName);
    }
}
