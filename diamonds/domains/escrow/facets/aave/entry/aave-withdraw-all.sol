// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/a-token.sol";

abstract contract ent_withdraw_all_v1 is
    int_tokenUpdated_Escrow,
    int_a_token,
    mod_onlyOwner_AccessControl
{
    /**
        @notice This event is emitted every time Aave redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Withdrawal.
        @param aTokenBalanceBeforeDeposit aTokens balance after Withdrawal.
        @param aTokenBalanceAfterWithdrawal aTokens balance after Withdrawal.
     */
    event AaveWithdrawn(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 aTokenBalanceBeforeDeposit,
        uint256 aTokenBalanceAfterWithdrawal
    );

    /**
        @notice This function withdraws all the user's aTokens from previous deposits
        @param tokenAddress address of the token
     */
    function withdrawAll(address tokenAddress) public override onlyOwner {
        IAToken aToken = _getAToken(tokenAddress);

        uint256 aTokenBalanceBeforeWithdraw = aToken.balanceOf(address(this));
        require(aTokenBalanceBeforeWithdraw >= 0, "NO_BALANCE_TO_WITHDRAW");

        IAaveLendingPool aaveLendingPool = _getAaveLendingPool();
        aaveLendingPool.withdraw(
            tokenAddress,
            aTokenBalanceBeforeWithdraw,
            address(this)
        );
        uint256 aTokenBalanceAfterWithdraw = aToken.balanceOf(address(this));
        require(aTokenBalanceAfterWithdraw == 0, "AAVE_WITHDRAWAL_ERROR");

        _tokenUpdated(address(aToken));
        _tokenUpdated(tokenAddress);

        emit AaveWithdrawn(
            tokenAddress,
            address(aToken),
            aTokenBalanceBeforeWithdraw,
            aTokenBalanceBeforeWithdraw,
            aTokenBalanceAfterWithdraw
        );
    }
}

abstract contract ent_withdraw_all is ent_withdraw_all_v1 {}
