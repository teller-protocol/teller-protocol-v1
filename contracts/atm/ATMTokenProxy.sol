pragma solidity 0.5.17;

import "./BaseATMProxy.sol";

contract ATMTokenProxy is BaseATMProxy {
    constructor(
        string memory name,
        string memory symbol,
        uint8 decimals,
        uint256 cap,
        uint256 maxVestingPerWallet,
        address atmSettingsAddress,
        address atm
    ) public payable {
        bytes memory initData = abi.encodeWithSignature(
            "initialize(string,string,uint8,uint256,uint256,address,address)",
            name,
            symbol,
            decimals,
            cap,
            maxVestingPerWallet,
            atmSettingsAddress,
            atm
        );
        address logic = _getImplementation(atmSettingsAddress);
        _delegateToWith(logic, initData);
    }

    /** internal functions **/

    /**
        @notice it is the logic of grabbing the current ATMToken logic address from an ATMSettings contract address.
        @param atmSettingsAddress address of an ATMSettings contract
        @return address of ATMToken logic implementation
     */
    function _getImplementation(address atmSettingsAddress) internal view returns (address) {
        return IATMSettings(atmSettingsAddress).atmTokenLogic();
    }
}
