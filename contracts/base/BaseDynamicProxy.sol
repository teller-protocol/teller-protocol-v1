pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";

contract BaseDynamicProxy is BaseProxy {
    /** Internal Functions **/

    /**
        @notice Returns the current implementation.
        @dev It uses the LogicVersionsRegistry contract to get the logic address for a given logic name.
        @return address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return _getSettings().versionsRegistry().getLogicVersionAddress(logicName());
    }
}
