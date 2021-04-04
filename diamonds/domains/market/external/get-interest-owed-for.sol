// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { ext_get_interest_ratio } from "../external/get-interest-ratio.sol";

abstract contract ext_get_interest_owed_for_v1 is ext_get_interest_ratio {
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
        return amountBorrow.percent(getInterestRatio(loanID));
    }
}

abstract contract ext_get_interest_owed_for is ext_get_interest_owed_for_v1 {}
