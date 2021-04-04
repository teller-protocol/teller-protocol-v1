// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/a-token.sol";

abstract contract ent_withdraw is ent_withdraw_v1 {}

abstract contract ent_withdraw_v1 is
    int_tokenUpdated_Escrow,
    int_a_token,
    mod_onlyOwner_AccessControl
{
    /**
        @notice This function withdraws the user's aTokens for a specific amount
        @param tokenAddress address of the token
        @param amount amount of the underlying tokens to withdraw
     */
    function withdraw(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        IAToken aToken = _getAToken(tokenAddress);
        IAaveLendingPool aaveLendingPool = _getAaveLendingPool();
        uint256 aTokenBalanceBeforeWithdraw = aToken.balanceOf(address(this));
        require(
            aTokenBalanceBeforeWithdraw >= amount,
            "NO_BALANCE_TO_WITHDRAW"
        );
        aaveLendingPool.withdraw(tokenAddress, amount, address(this));
        uint256 aTokenBalanceAfterWithdraw = aToken.balanceOf(address(this));
        require(
            aTokenBalanceAfterWithdraw < aTokenBalanceBeforeWithdraw,
            "AAVE_WITHDRAWAL_ERROR"
        );

        _tokenUpdated(address(aToken));
        _tokenUpdated(tokenAddress);

        emit AaveWithdrawn(
            tokenAddress,
            address(aToken),
            amount,
            aTokenBalanceBeforeWithdraw,
            aTokenBalanceAfterWithdraw
        );
    }
}
