// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../contracts/interfaces/IPlatformSettings.sol";
import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";
import { dat_Loans } from "../data/loans.sol";

abstract contract mod_only_enough_submissions_v1 is
    dat_Loans,
    int_get_sto_Loans
{
    modifier onlyEnoughSubmissions(uint256 responseCount) {
        uint256 percentageRequired =
            IPlatformSettings(PROTOCOL).getRequiredSubmissionsPercentageValue();

        require(
            responseCount.ratioOf(s().signers.array.length) >=
                percentageRequired,
            "INSUFFICIENT_NUMBER_OF_RESPONSES"
        );
        _;
    }
}

abstract contract mod_only_enough_submissions is
    mod_only_enough_submissions_v1
{}
