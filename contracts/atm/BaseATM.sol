pragma solidity 0.5.17;

import "../settings/IATMSettings.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                         THIS IS A BASE CONTRACT FOR THE ATM CONTRACTS                           **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or ADD ANY storage variables to this or new versions of this        **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This acts as a base contract for all the ATM contracts.

    @author develop@teller.finance
 */
contract BaseATM {
    /**
        @notice It represents the current address for the ATMSettings contract.
     */
    IATMSettings public atmSettings;

    /**
        @notice It requires that the caller is assigned the pauser role within the protocol settings.
     */
    modifier onlyPauser() {
        require(atmSettings.settings().hasPauserRole(msg.sender), "ONLY_PAUSER");
        _;
    }
}
