// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../../interfaces/CErc20Interface.sol";
import "../../../data/escrow.sol";
import "../../../internal/token-updated.sol";

abstract contract int_redeem is int_redeem_v1 {}

abstract contract int_redeem_v1 is dat_Escrow, int_tokenUpdated_Escrow {
    /**
        @notice This function calls on Compound cToken to redeem an amount of the underlying token.
        @param cToken the instance of the cToken.
        @param amount amount of cToken or underlying token to redeem.
        @param isUnderlying boolean indicating if the amount to redeem is in the underlying token amount.
    */
    function _redeem(
        CErc20Interface cToken,
        uint256 amount,
        bool isUnderlying
    ) internal {
        address tokenAddress = cToken.underlying();
        uint256 result =
            isUnderlying
                ? cToken.redeemUnderlying(amount)
                : cToken.redeem(amount);
        require(
            result != TOKEN_INSUFFICIENT_BALANCE,
            "COMPOUND_INSUFFICIENT_BALANCE"
        );
        require(result == NO_ERROR, "COMPOUND_WITHDRAWAL_ERROR");

        _tokenUpdated(address(cToken));
        _tokenUpdated(tokenAddress);

        emit CompoundRedeemed(
            tokenAddress,
            address(cToken),
            amount,
            isUnderlying,
            _balanceOf(tokenAddress),
            cToken.balanceOf(address(this))
        );
    }
}
