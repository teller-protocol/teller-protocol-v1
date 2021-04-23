// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibEscrow } from "../escrow/libraries/LibEscrow.sol";

// Storage
import { Loan } from "../storage/market.sol";

contract LoanDataFacet {
    /**
     * @notice Returns the information about the given {loanID}.
     * @param loanID The loan ID to get information for.
     * @return loan_ The loan data.
     */
    function getLoan(uint256 loanID) external view returns (Loan memory loan_) {
        loan_ = LibLoans.s().loans[loanID];
    }

    /**
     * @notice Returns the loan IDs created by the {borrower} account.
     * @param borrower The account to get loan IDs for.
     * @return loanIDs The IDs for loans created by the {borrower}
     */
    function getBorrowerLoans(address borrower)
        external
        view
        returns (uint256[] memory loanIDs)
    {
        return LibLoans.s().borrowerLoans[borrower];
    }

    /**
     * @notice Returns the total amount owed for a specified loan.
     * @param loanID The loan ID to get the total amount owed.
     * @return uint256 The total owed amount.
     */
    function getTotalOwed(uint256 loanID) external view returns (uint256) {
        return LibLoans.getTotalOwed(loanID);
    }

    /**
     * @notice Returns the amount of interest owed for a given loan and loan amount.
     * @param loanID The loan ID to get the owed interest.
     * @param amountBorrow The principal of the loan to take out.
     * @return uint256 The interest owed.
     */
    function getInterestOwedFor(uint256 loanID, uint256 amountBorrow)
        external
        view
        returns (uint256)
    {
        return LibLoans.getInterestOwedFor(loanID, amountBorrow);
    }

    function getCollateralNeededInfo(uint256 loanID)
        external
        view
        returns (
            uint256 neededInLendingTokens,
            uint256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        return LibLoans.getCollateralNeededInfo(loanID);
    }

    /**
        @notice It calculates the market state values across a given markets.
        @notice Returns values that represent the global state across the market.
        @param lendingToken The address of the asset.
        @return totalSupplied Total amount of the underlying asset supplied.
        @return totalBorrowed Total amount borrowed through loans.
        @return totalRepaid The total amount repaid till the current timestamp.
        @return totalOnLoan Total amount currently deployed in loans.
     */
    function getMarketState(address lendingToken)
        public
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid,
            uint256 totalOnLoan
        )
    {
        return LibLoans.getMarketState(lendingToken);
    }

    function getLoanEscrow(uint256 loanID)
        external
        view
        returns (address escrow_)
    {
        escrow_ = address(LibLoans.s().loanEscrows[loanID]);
    }

    function getLoanEscrowValue(uint256 loanID)
        external
        view
        returns (uint256)
    {
        return LibEscrow.calculateTotalValue(loanID);
    }
}
