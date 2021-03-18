pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./BaseDynamicProxy.sol";
import "../upgradeable/DynamicUpgradeableERC20.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract ERC20DynamicProxy is BaseDynamicProxy, DynamicUpgradeableERC20 {
    /**
        @notice It creates a new dynamic proxy specific for the TToken given a logic registry contract and a logic name.
        @param logicRegistryAddress the settings contract address.
        @param aLogicName the settings contract address.
     */
    constructor(address logicRegistryAddress, bytes32 aLogicName) public {
        logicRegistry = LogicVersionsRegistryInterface(logicRegistryAddress);
        logicName = aLogicName;
        strictDynamic = true;
        _updateImplementationStored();
    }
}
