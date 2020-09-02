pragma solidity 0.5.17;

// Contracts
import "./BaseProxy.sol";
import "./BaseUpgradeable.sol";

contract BaseDynamicProxy is BaseUpgradeable, BaseProxy {
    /** Internal Functions **/

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view returns (address) {
        return settings().versionsRegistry().getLogicVersionAddress(logicName());
    }
}
