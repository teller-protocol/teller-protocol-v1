pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseProxy.sol";
import "./DynamicUpgradeable.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract InitializeableDynamicProxy is BaseProxy, DynamicUpgradeable {
    /**
        @notice It initializes a new dynamic proxy given a logic registry contract and a logic name.
        @param aLogicRegistryAddress the settings contract address.
        @param aLogicName the settings contract address.
     */
    function _initialize(address aLogicRegistryAddress, bytes32 aLogicName)
        internal
    {
        require(address(logicRegistry) == address(0), "PROXY_ALREADY_INIT");
        logicRegistry = LogicVersionsRegistryInterface(aLogicRegistryAddress);
        logicName = aLogicName;
    }
}
