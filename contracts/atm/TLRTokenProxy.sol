pragma solidity 0.5.17;

import "./BaseATMProxy.sol";

/**
 * @notice It is the Proxy contract for TLR Tokens.
 *
 * @author develop@teller.finance
 */
contract TLRTokenProxy is BaseATMProxy {
    /**
        @notice This constructor forwards the parameters to the implementation logic contract defined in ATMSettings.
        @param name The name of the token
        @param symbol The symbol of the token
        @param decimals The amount of decimals for token
        @param cap The maximum number of tokens available
        @param maxVestingPerWallet The maximum number of times a wallet can mint their vesting
        @param atmSettingsAddress The ATMSettings address
        @param atm The ATMGovernance address for this token
     */
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
        @notice it is the logic of grabbing the current TLRToken logic address from an ATMSettings contract address.
        @param atmSettingsAddress address of an ATMSettings contract
        @return address of TLRToken logic implementation
     */
    function _getImplementation(address atmSettingsAddress) internal view returns (address) {
        return IATMSettings(atmSettingsAddress).tlrTokenLogic();
    }
}
