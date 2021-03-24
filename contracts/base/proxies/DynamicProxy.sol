pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseDynamicProxy.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract DynamicProxy is BaseDynamicProxy {
    /**
        @notice It creates a new dynamic proxy given a logic registry contract and a logic name.
        @param logicRegistryAddress the settings contract address.
        @param aLogicName the settings contract address.
        @param isStrictDynamic Boolean indicating if the proxy must check the registry for a new implementation.
     */
    constructor(
        address logicRegistryAddress,
        bytes32 aLogicName,
        bool isStrictDynamic
    ) public {
        logicRegistry = LogicVersionsRegistryInterface(logicRegistryAddress);
        logicName = aLogicName;
        strictDynamic = isStrictDynamic;
        _updateImplementationStored();
    }
}
