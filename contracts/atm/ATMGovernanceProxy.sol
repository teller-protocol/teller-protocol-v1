pragma solidity 0.5.17;

import "./BaseATMProxy.sol";

/**
    @notice It is the Proxy contract for ATM Governance.
 */
contract ATMGovernanceProxy is BaseATMProxy {
    /**
        @notice This constructor forwards the parameters to the implementation logic contract defined in ATMSettings.
        @param atmSettingsAddress The ATMSettings address
     */
    constructor(address atmSettingsAddress) public payable {
        bytes memory initData = abi.encodeWithSignature("initialize(address)", atmSettingsAddress);
        address logic = _getImplementation(atmSettingsAddress);
        _delegateToWith(logic, initData);
    }

    /** Internal Functions **/

    /**
        @notice It is the logic of grabbing the current ATMGovernance logic address from an ATMSettings contract address.
        @param atmSettingsAddress address of an ATMSettings contract
        @return address of ATMGovernance logic implementation
     */
    function _getImplementation(address atmSettingsAddress) internal view returns (address) {
        return IATMSettings(atmSettingsAddress).atmGovernanceLogic();
    }
}
