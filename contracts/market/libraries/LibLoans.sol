// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus
} from "../../storage/market.sol";
import { AppStorageLib } from "../../storage/app.sol";
import { IEscrow } from "../../shared/interfaces/IEscrow.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/PlatformSettingsLib.sol";

library LibLoans {
    using NumbersLib for int256;

    function libStore() private pure returns (MarketStorage storage) {
        return MarketStorageLib.marketStore();
    }

    function getCollateralNeededInfo(uint256 loanID)
        internal
        view
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        (neededInLendingTokens, escrowLoanValue) = getCollateralNeededInTokens(
            loanID
        );

        if (neededInLendingTokens == 0) {
            neededInCollateralTokens = 0;
        } else {
            uint256 value =
                AppStorageLib.store().priceAggregator.valueFor(
                    libStore().loans[loanID].lendingToken,
                    libStore().loans[loanID].collateralToken,
                    uint256(
                        neededInLendingTokens < 0
                            ? -neededInLendingTokens
                            : neededInLendingTokens
                    )
                );
            neededInCollateralTokens = int256(value);
            if (neededInLendingTokens < 0) {
                neededInCollateralTokens = neededInCollateralTokens * -1;
            }
        }
    }

    /**
     * @notice Returns the minimum collateral value threshold, in the lending token, needed to take out the loan or for it be liquidated.
     * @dev If the loan status is TermsSet, then the value is whats needed to take out the loan.
     * @dev If the loan status is Active, then the value is the threshold at which the loan can be liquidated at.
     * @param loanID The loan ID to get needed collateral info for.
     * @return neededInLendingTokens int256 The minimum collateral value threshold required.
     * @return escrowLoanValue uint256 The value of the loan held in the escrow contract.
     */
    function getCollateralNeededInTokens(uint256 loanID)
        internal
        view
        returns (int256 neededInLendingTokens, uint256 escrowLoanValue)
    {
        if (
            !_isActiveOrSet(loanID) ||
            libStore().loans[loanID].loanTerms.collateralRatio == 0
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
        if (libStore().loans[loanID].status == LoanStatus.TermsSet) {
            neededInLendingTokens = int256(_getLoanAmount(loanID)).percent(
                libStore().loans[loanID].loanTerms.collateralRatio
            );
        } else {
            neededInLendingTokens = int256(
                libStore().loans[loanID].principalOwed
            );
            uint256 requiredRatio =
                libStore().loans[loanID].loanTerms.collateralRatio -
                    getInterestRatio(loanID) -
                    PlatformSettingsLib.getCollateralBufferValue();
            if (libStore().loans[loanID].escrow != address(0)) {
                escrowLoanValue = IEscrow(libStore().loans[loanID].escrow)
                    .calculateTotalValue();
                neededInLendingTokens =
                    neededInLendingTokens +
                    (neededInLendingTokens - int256(escrowLoanValue));
            }
            neededInLendingTokens =
                neededInLendingTokens +
                (int256(libStore().loans[loanID].interestOwed)).percent(
                    requiredRatio
                );
        }
    }

    function canGoToEOA(uint256 loanID) internal view returns (bool) {
        return
            libStore().loans[loanID].loanTerms.collateralRatio >=
            PlatformSettingsLib.getOverCollateralizedBufferValue();
    }

    /**
     * @notice Returns the interest ratio based on the loan interest rate for the loan duration.
     * @dev The interest rate on the loan terms is APY.
     * @param loanID The loan ID to get the interest rate for.
     */
    function getInterestRatio(uint256 loanID) internal view returns (uint256) {
        return
            (libStore().loans[loanID].loanTerms.interestRate *
                (libStore().loans[loanID].loanTerms.duration)) /
            //                .div(SECONDS_PER_YEAR); // change to new constants file once written
            (31536000);
    }

    function _getLoanAmount(uint256 loanID) private view returns (uint256) {
        if (libStore().loans[loanID].status == LoanStatus.TermsSet) {
            return libStore().loans[loanID].loanTerms.maxLoanAmount;
        } else if (libStore().loans[loanID].status == LoanStatus.Active) {
            return libStore().loans[loanID].borrowedAmount;
        }
        return 0;
    }

    function _isActiveOrSet(uint256 loanID) private view returns (bool) {
        LoanStatus status = libStore().loans[loanID].status;
        return status == LoanStatus.Active || status == LoanStatus.TermsSet;
    }
}
