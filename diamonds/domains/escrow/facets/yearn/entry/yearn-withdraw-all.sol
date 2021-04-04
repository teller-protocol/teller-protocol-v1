// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/y_vault.sol";

abstract contract ent_withdraw_all is ent_withdraw_all_v1 {}

abstract contract ent_withdraw_all_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_y_vault
{
    /**
        @notice Redeems all funds from a yVault from a previous deposit
        @param tokenAddress The address of the token being deposited
     */
    function withdrawAll(address tokenAddress) public override onlyOwner {
        IVault iVault = _getYVault(tokenAddress);
        uint256 tokenBalanceBeforeWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        iVault.withdraw();
        uint256 tokenBalanceAfterWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        require(
            tokenBalanceAfterWithdrawal > tokenBalanceBeforeWithdrawal,
            "WITHDRAWAL_UNSUCCESSFUL"
        );
        emit YearnWithdrawn(
            iVault.token(),
            address(iVault),
            tokenBalanceBeforeWithdrawal,
            tokenBalanceBeforeWithdrawal,
            tokenBalanceAfterWithdrawal
        );
    }
}
