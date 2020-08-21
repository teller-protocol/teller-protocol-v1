pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "./SettingsInterface.sol";
import "./EscrowFactoryInterface.sol";
import "./LoansInterface.sol";
import "../util/TellerCommon.sol";


/**
    @notice This interface defines all function to allow borrowers interact with their escrow contracts.
    
    @author develop@teller.finance
 */
interface EscrowInterface {

    /**
        @notice This struct defines the dapp address and data to execute in the callDapp function.
        @dev It is executed using a delegatecall.
     */
    struct DappData {
        address location;
        bytes data;
    }

    /**
        @notice It gets the escrow factory address.
     */
    function settings() external view returns (SettingsInterface);

    /**
        @notice It gets the escrow factory address.
     */
    function factory() external view returns (EscrowFactoryInterface);

    /**
        @notice It gets the current loans contract address.
     */
    function loans() external view returns (LoansInterface);

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

}
