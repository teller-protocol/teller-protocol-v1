pragma solidity 0.5.17;

import "../settings/IATMSettings.sol";

contract BaseATM {
    IATMSettings public atmSettings;

    modifier onlySigner() {
        require(atmSettings.settings().hasPauserRole(msg.sender), "ONLY_SIGNER");
        _;
    }
}
