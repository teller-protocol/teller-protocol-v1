// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    MarketStorageLib,
    LoanStatus,
    LoanRequest
} from "../storage/market.sol";
import { MaxLoanAmountLib } from "../settings/asset/MaxLoanAmountLib.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/PlatformSettingsLib.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";

abstract contract LoansMods {
    using NumbersLib for uint256;
    /**
     * @notice Checks whether the loan is active or not
     * @dev Throws a require error if the loan is not active
     * @param loanID number of loan to check
     */
    modifier loanActive(uint256 loanID) {
        require(
            MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.Active,
            "LOAN_NOT_ACTIVE"
        );
        _;
    }
    /**
     * @notice Checks whether the loan is active and has been set or not
     * @dev Throws a require error if the loan is not active or has not been set
     * @param loanID number of loan to check
     */
    modifier loanActiveOrSet(uint256 loanID) {
        require(
            MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.Active ||
                MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.TermsSet,
            "Teller: loan not active or set"
        );
        _;
    }

    /**
     * @notice Checks the given loan request is valid.
     * @dev It throws an require error if the duration exceeds the maximum loan duration.
     * @dev It throws an require error if the loan amount exceeds the maximum loan amount for the given asset.
     * @param loanRequest to validate.
     */
    modifier withValidLoanRequest(LoanRequest memory loanRequest) {
        require(
            PlatformSettingsLib.getMaximumLoanDurationValue() >=
                loanRequest.duration,
            "Teller: max loan duration exceeded"
        );

        require(
            MaxLoanAmountLib.get(loanRequest.assetAddress) > loanRequest.amount,
            "Teller: max loan amount exceeded"
        );

        require(
            LendingLib.isDebtRatioValid(
                loanRequest.assetAddress,
                loanRequest.amount
            ),
            "Teller: max supply-to-debt ratio exceeded"
        );
        _;
    }

    modifier onlyBorrower(uint256 loanID) {
        require(
            msg.sender == MarketStorageLib.marketStore().loans[loanID].borrower
        );
        _;
    }
}
