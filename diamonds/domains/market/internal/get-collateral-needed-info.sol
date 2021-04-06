// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/get-collateral-needed-in-tokens.sol";

abstract contract int_get_collateral_needed_info_v1 is
    int_get_collateral_needed_in_tokens
{
    function _getCollateralNeededInfo(uint256 loanID)
        internal
        view
        override
        returns (
            int256 neededInLendingTokens,
            int256 neededInCollateralTokens,
            uint256 escrowLoanValue
        )
    {
        (neededInLendingTokens, escrowLoanValue) = _getCollateralNeededInTokens(
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

abstract contract int_get_collateral_needed_info is
    int_get_collateral_needed_info_v1
{}
