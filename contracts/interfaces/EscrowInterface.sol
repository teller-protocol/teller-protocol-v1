pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";


/**
    @notice This interface defines all function to allow borrowers interact with their escrow contracts.
    
    @author develop@teller.finance
 */
interface EscrowInterface {

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData) external;

    function initialize(address loansAddress, uint256 aLoanID) external;
}
