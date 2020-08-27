pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";
import "./BaseDynamic.sol";


/**
TODO Change it
    @notice It is a Proxy contract for Escrows that uses the logic implementation as defined in the global EscrowFactory contract.
    @notice It extends BaseEscrow to get access to the settings.

    @author develop@teller.finance
 */
contract DynamicProxy is BaseProxy, BaseDynamic {
    /**
        @notice It creates a new dynamic proxy given a logic versions registry.
        @param logicVersionsRegistryAddress the logic versions trgistry contract address.
     */
    constructor(address logicVersionsRegistryAddress, bytes32 aLogicName)
        public
        payable // TODO Why is it payable?
    {
        require(logicVersionsRegistryAddress.isContract(), "LOGIC_REGISTRY_MUST_BE_A_CONTRACT");
        versionsRegistry = LogicVersionsRegistryInterface(logicVersionsRegistryAddress);

        require(versionsRegistry.hasLogicVersion(aLogicName), "LOGIC_NAME_NOT_EXIST");
        logicName = aLogicName;
    }

    /** Internal Functions **/

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return versionsRegistry.getLogicVersionAddress(logicName);
    }
}
