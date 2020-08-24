pragma solidity 0.5.17;

import "../base/BaseProxy.sol";
import "./BaseATM.sol";

contract BaseATMProxy is BaseProxy, BaseATM {
    /** Internal Functions **/

    /**
        @notice It is the logic of grabbing the ATMSettings contract address from state and getting child contract logic implementation address.
     */
    function _implementation() internal view returns (address imp) {
        imp = _getImplementation(address(atmSettings));
    }

    /**
        @notice It is the logic of grabbing the child logic implementation address from an ATMSettings contract address.
        @param atmSettingsAddress address of an ATMSettings contract
        @return Current child contract logic implementation
     */
    function _getImplementation(address atmSettingsAddress) internal view returns (address);
}
