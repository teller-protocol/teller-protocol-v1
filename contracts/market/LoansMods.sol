// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    MarketStorageLib,
    LoanStatus,
    LoanRequest
} from "../storage/market.sol";
import { AppStorageLib } from "../storage/app.sol";
import {
    MAX_LOAN_AMOUNT_ASSET_SETTING,
    MAX_DEBT_RATIO_SETTING
} from "../shared/constants/asset-setting-names.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/PlatformSettingsLib.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";
import { LibLendingPool } from "../lending/libraries/LibLendingPool.sol";

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
            "LOAN_NOT_ACTIVE_OR_SET"
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
            "DURATION_EXCEEDS_MAX_DURATION"
        );

        bool exceedsMaxLoanAmount =
            //            AppStorageLib.store().assetSettings[MarketStorageLib.marketStore()
            //            .lendingPool[].lendingToken].exceedsUint( // change once lending pool facet is done
            AppStorageLib.store().assetSettings[
                AppStorageLib.store().assetAddresses["DAI"]
            ]
                .uints[MAX_LOAN_AMOUNT_ASSET_SETTING] < loanRequest.amount;
        require(!exceedsMaxLoanAmount, "AMOUNT_EXCEEDS_MAX_AMOUNT");

        require(
            _isDebtRatioValid(
                AppStorageLib.store().assetAddresses["DAI"],
                loanRequest.amount
            ),
            "SUPPLY_TO_DEBT_EXCEEDS_MAX"
        );
        _;
    }

    /**
     * @notice It validates whether supply to debt (StD) ratio is valid including the loan amount.
     * @param newLoanAmount the new loan amount to consider o the StD ratio.
     * @return true if the ratio is valid. Otherwise it returns false.
     */
    function _isDebtRatioValid(address lendingToken, uint256 newLoanAmount)
        internal
        view
        returns (bool)
    {
        uint256 maxDebtRatio =
            AppStorageLib.store().assetSettings[lendingToken].uints[
                MAX_DEBT_RATIO_SETTING
            ];
        return
            LibLendingPool.getDebtRatioFor(lendingToken, newLoanAmount) <=
            maxDebtRatio;
    }
}
