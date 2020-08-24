pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts

// Interfaces
import "../interfaces/EscrowInterface.sol";

// Libraries
import "./BaseEscrow.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used by borrowers to call DApp functions (using delegate calls).
    @notice In order to call a DApp function, the DApp must be added in the EscrowFactory instance.
    @dev The current DApp implementations are: Uniswap and Compound.

    @author develop@teller.finance
 */
contract Escrow is BaseEscrow, EscrowInterface {
    /**
        @notice It checks whether the sender is the borrower or not.
        @dev It throws a require error if the sender is not the borrower associated to the current loan id.
     */
    modifier onlyBorrower() {
        require(_isBorrower(), "CALLER_NOT_BORROWER");
        _;
    }

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        onlyBorrower()
    {
        require(settings.getEscrowFactory().isDapp(dappData.location), "DAPP_NOT_WHITELISTED");

        (bool success, ) = dappData.location.delegatecall(dappData.data);

        require(success, "DAPP_CALL_FAILED");
    }

    /** Internal Functions */

    /**
        @notice It checks whether the sender is the loans borrower or not.
        @dev It throws a require error it sender is not the loans borrower.
     */
    function _isBorrower() internal view returns (bool) {
        return msg.sender == loans.loans(loanID).loanTerms.borrower;
    }
}
