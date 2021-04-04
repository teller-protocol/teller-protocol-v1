// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    ext_get_collateral_needed_in_tokens
} from "../external/get-collateral-needed-in-tokens.sol";

abstract contract ext_get_collateral_needed_info_v1 is
    ext_get_collateral_needed_in_tokens
{
    function getCollateralNeededInfo(uint256 loanID)
        public
        view
        override
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
                IPriceAggregator().valueFor(
                    lendingToken,
                    collateralToken,
                    uint256(
                        neededInLendingTokens < 0
                            ? -neededInLendingTokens
                            : neededInLendingTokens
                    )
                );
            neededInCollateralTokens = int256(value);
            if (neededInLendingTokens < 0) {
                neededInCollateralTokens = neededInCollateralTokens.mul(-1);
            }
        }
    }
}

abstract contract ext_get_collateral_needed_info is
    ext_get_collateral_needed_info_v1
{}
