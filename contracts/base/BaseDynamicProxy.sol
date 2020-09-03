pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";
import "./BaseUpgradeable.sol";

contract BaseDynamicProxy is BaseUpgradeable, BaseProxy {
    /** Internal Functions **/

    /**
        @notice Returns the current implementation.
        @dev It uses the LogicVersionsRegistry contract to get the logic address for a given logic name.
        @return address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return settings().versionsRegistry().getLogicVersionAddress(logicName());
    }
}
