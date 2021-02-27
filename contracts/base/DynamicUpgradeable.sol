pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts

// Interfaces
import "../interfaces/LogicVersionsRegistryInterface.sol";

import "hardhat/console.sol";

contract DynamicUpgradeable {
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

    function implementation() external view returns (address) {
        return _implementation();
    }

    /** Internal Functions **/

    /**
        @notice Returns the current implementation.
        @dev It uses the LogicVersionsRegistry contract to get the logic address for a given logic name.
        @return address of the current implementation
     */
    function _implementation() internal view returns (address logic) {
        (, , logic) = logicRegistry.getLogicVersion(logicName);
    }
}
