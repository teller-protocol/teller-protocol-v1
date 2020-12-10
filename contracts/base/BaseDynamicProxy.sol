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

    /**
        * @notice Overrides the _willFallback() function of Proxy, which enables some code to
        * be executed prior to the fallback function. In this case, the purpose of this code
        * is to check if the msg.sender has the authorization required to interact with the Teller protocol
    */
    function _willFallback() internal {
        if ((msg.sender != address(this) || msg.sender != address(settings())) && settings().isPlatformRestricted()) {
            (, bytes memory returnData) = msg.sender.staticcall(
                abi.encodeWithSignature("logicName()")
            );
            bytes32 logicVersion = abi.decode(returnData, (bytes32));
            require(
                settings().versionsRegistry().hasLogicVersion(logicVersion) ||
                settings().hasPauserRole(msg.sender) ||
                settings().hasAuthorization(msg.sender),
                "CALLER_NOT_AUTHORIZED"
            );
        }
        super._willFallback();
    }
}
