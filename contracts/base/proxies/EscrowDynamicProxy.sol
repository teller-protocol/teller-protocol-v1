pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./InitializeableDynamicProxy.sol";

// Interfaces
import "../../interfaces/IEscrowDynamicProxy.sol";

/**
    @notice It is a dynamic proxy contract for any contract. It uses the logic versions registry to get a logic contract address.
    @notice It extends BaseUpgradeable to get access to the settings.

    @author develop@teller.finance
 */
contract EscrowDynamicProxy is IEscrowDynamicProxy, InitializeableDynamicProxy {
    /**
        @notice It initializes a new dynamic proxy given a logic registry contract and a logic name.
        @param aLogicRegistryAddress the settings contract address.
     */
    function initialize(address aLogicRegistryAddress) external {
        require(address(logicRegistry) == address(0), "PROXY_ALREADY_INIT");
        logicRegistry = LogicVersionsRegistryInterface(aLogicRegistryAddress);
        logicName = logicRegistry.consts().ESCROW_LOGIC_NAME();
        strictDynamic = true;
        _updateImplementationStored();
    }
}
