// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../interfaces/IEscrow.sol";
import "../../protocol/interfaces/IPlatformSettings.sol";
import "../internal/get-loan-amount.sol";
import "../internal/is-active-or-set.sol";
import "../../protocol/address.sol";

abstract contract int_get_collateral_needed_in_tokens_v1 is
    int_getLoanAmount_v1,
    int_isActiveOrSet_v1
{
    /**
     * @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
     * @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
     * @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
     * @param loanID The loan ID to get needed collateral info for.
     * @return neededInLendingTokens int256 The minimum collateral value threshold required.
     * @return escrowLoanValue uint256 The value of the loan held in the escrow contract.
     */
    function _getCollateralNeededInTokens(uint256 loanID)
        public
        view
        override
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue)
    {
        if (
            !_isActiveOrSet(loanID) ||
            getLoansStorage().loans[loanID].loanTerms.collateralRatio == 0
        ) {
            return (0, 0);
        }

        /*
            The collateral to principal owed ratio is the sum of:
                * collateral buffer percent
                * loan interest rate
                * liquidation reward percent
                * X factor of additional collateral
        */
        // * To take out a loan (if status == TermsSet), the required collateral is (max loan amount * the collateral ratio).
        // * For the loan to not be liquidated (when status == Active), the minimum collateral is (principal owed * (X collateral factor + liquidation reward)).
        // * If the loan has an escrow account, the minimum collateral is ((principal owed - escrow value) * (X collateral factor + liquidation reward)).
        if (
            getLoansStorage().loans[loanID].status ==
            TellerCommon.LoanStatus.TermsSet
        ) {
            neededInLendingTokens = int256(_getLoanAmount(loanID)).percent(
                getLoansStorage().loans[loanID].loanTerms.collateralRatio
            );
        } else {
            neededInLendingTokens = int256(
                getLoansStorage().loans[loanID].principalOwed
            );
            uint256 bufferPercent =
                IPlatformSettings(PROTOCOL)._getCollateralBufferValue();
            uint256 requiredRatio =
                getLoansStorage().loans[loanID]
                    .loanTerms
                    .collateralRatio
                    .sub(getInterestRatio(loanID))
                    .sub(bufferPercent);
            if (getLoansStorage().loans[loanID].escrow != address(0)) {
                escrowLoanValue = IEscrow(
                    getLoansStorage().loans[loanID]
                        .escrow
                )
                    .calculateTotalValue();
                neededInLendingTokens = neededInLendingTokens.add(
                    neededInLendingTokens.sub(int256(escrowLoanValue))
                );
            }
            neededInLendingTokens = neededInLendingTokens
                .add(int256(getLoansStorage().loans[loanID].interestOwed))
                .percent(requiredRatio);
        }
    }
}

abstract contract int_get_collateral_needed_in_tokens is
    int_get_collateral_needed_in_tokens_v1
{}
