// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../../data/escrow.sol";
import "../../../internal/token-updated.sol";

abstract contract int_redeem_v1 is dat_Escrow, int_tokenUpdated_Escrow {
    /**
        @notice This event is emitted every time Compound redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Redeem.
        @param isUnderlyingAmount boolean indicating if the amount was in the underlying token.
        @param tokenBalance underlying token balance after Redeem.
        @param cTokenBalance cTokens balance after Redeem.
     */
    event CompoundRedeemed(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        bool isUnderlyingAmount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );

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

abstract contract int_redeem is int_redeem_v1 {}
