pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts

// Interfaces
import "../../interfaces/LogicVersionsRegistryInterface.sol";

contract DynamicUpgradeable {
    /* State Variables */

    /**
          @notice It returns the logic registry that is used to determine the implementation logic for this proxy.
          @dev See LogicVersionsRegistry contract.
          @return LogicVersionsRegistryInterface
       */
    LogicVersionsRegistryInterface public logicRegistry;

    /**
          @notice It represent the logic name (key) used for this proxy.
          @dev It is used by LogicVersionsRegistry to get the logic address for the given logic name.
          @dev It must NOT change over time.
          @return bytes32 the logic name.
       */
    bytes32 public logicName;

    // @param strictDynamic Boolean indicating if the proxy must check the registry for a new implementation.
    bool public strictDynamic;

    /**
        @notice It stores the last known logic address locally to reduce gas costs.
     */
    address public implementationStored;

    /**
        @notice It is the block number which the last time the proxy implementation was checked.
     */
    uint256 internal _implementationBlockUpdated;

    /* External Functions */

    function upgradeProxyTo(address newImplementation) public {
        require(msg.sender == address(logicRegistry), "MUST_BE_LOGIC_REGISTRY");
        implementationStored = newImplementation;
        _implementationBlockUpdated = block.number;
    }

    /** Internal Functions **/

    /**
        @notice Returns the current implementation used by the proxy to delegate a call to.
        @return address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return implementationStored;
    }

    /**
        @notice Updates the current implementation logic address for the stored logic name.
        @dev It uses the LogicVersionsRegistry contract to get the logic address or the cached address if valid.
        @dev It caches the current logic address for the proxy to reduce gas on subsequent calls within the same block.
     */
    function _updateImplementationStored() internal {
        (, , address currentLogic) = logicRegistry.getLogicVersion(logicName);

        if (implementationStored != currentLogic) {
            implementationStored = currentLogic;
        }
        _implementationBlockUpdated = block.number;
    }

    /**
        @notice It is called by the OZ proxy contract before calling the internal _implementation() function.
     */
    function _willFallback() internal {
        if (strictDynamic && _implementationBlockUpdated + 50 <= block.number) {
            _updateImplementationStored();
        }
    }
}
