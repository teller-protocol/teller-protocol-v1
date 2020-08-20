pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice This interface defines all function to allow borrowers interact with their escrow contracts.
    
    @author develop@teller.finance
 */
interface EscrowInterface {

    /**
        @notice It gets the escrow factory address.
     */
    function factory() external view returns (uint256);

    /**
        @notice It gets the current loans contract address.
     */
    function loans() external view returns (address);

    /**
        @notice It gets the loan id associated to this escrow for the given loans contract.
        @return the loan id associated to this escrow contract.
     */
    function loanID() external view returns (uint256);

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData) external;

    /**
        @notice It initialzes this Escrow contract.
        @param loansAddress the Loans contract address.
        @param aLoanID the loanID associated to this Escrow contract.
     */
    function initialize(address loansAddress, uint256 aLoanID) external;

}
