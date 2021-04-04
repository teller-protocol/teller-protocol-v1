// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/a-token.sol";

abstract contract ent_withdrawAll is ent_withdrawAll_v1 {}

abstract contract ent_withdrawAll_v1 is
    int_tokenUpdated_Escrow,
    mod_onlyOwner_AccessControl
{
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
