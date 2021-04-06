// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/y_vault.sol";

abstract contract ent_withdraw is ent_withdraw_v1 {}

abstract contract ent_withdraw_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_y_vault
{
    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function withdraw(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        IVault iVault = _getYVault(tokenAddress);
        uint256 price = iVault.getPricePerShare();
        uint256 shares = amount / price;
        uint256 tokenBalanceBeforeWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        require(
            shares >= iVault.balanceOf(address(this)),
            "INSUFFICIENT_DEPOSIT"
        );
        iVault.withdraw(shares);
        uint256 tokenBalanceAfterWithdrawal =
            IERC20(tokenAddress).balanceOf(address(this));
        require(
            tokenBalanceAfterWithdrawal > tokenBalanceBeforeWithdrawal,
            "WITHDRAWAL_UNSUCCESSFUL"
        );

        _tokenUpdated(address(iVault));

        emit YearnWithdrawn(
            iVault.token(),
            address(iVault),
            amount,
            tokenBalanceBeforeWithdrawal,
            tokenBalanceAfterWithdrawal
        );
    }
}
