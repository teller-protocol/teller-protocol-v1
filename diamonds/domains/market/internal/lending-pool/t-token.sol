// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../data/lending-pool.sol";

abstract contract itn_tTokens_LendingPool_v1 is dat_LendingPool_v1 {
    function _tTokensFromLendingTokens(
        uint256 lendingTokenAmount,
        uint256 exchangeRate
    ) internal pure returns (uint256) {
        return
            (lendingTokenAmount *
                (uint256(10)**uint256(EXCHANGE_RATE_DECIMALS))) /
            (exchangeRate);
    }

    function _lendingTokensFromTTokens(
        uint256 tTokenAmount,
        uint256 exchangeRate
    ) internal pure returns (uint256) {
        return
            tTokenAmount.mul(exchangeRate).div(
                uint256(10)**uint256(EXCHANGE_RATE_DECIMALS)
            );
    }
}
