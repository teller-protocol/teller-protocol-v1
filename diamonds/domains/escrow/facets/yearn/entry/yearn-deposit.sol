// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/y_vault.sol";

abstract contract ent_deposit is ent_deposit_v1 {}

abstract contract ent_deposit_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_y_vault
{
    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function deposit(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        IVault iVault = _getYVault(tokenAddress);
        uint256 tokenBalanceBeforeDeposit = iVault.balanceOf(address(this));
        IERC20(tokenAddress).safeApprove(address(iVault), amount);
        iVault.deposit(amount);
        uint256 tokenBalanceAfterDeposit = iVault.balanceOf(address(this));
        require(
            tokenBalanceAfterDeposit > tokenBalanceBeforeDeposit,
            "YEARN_BALANCE_NOT_INCREASED"
        );
        _tokenUpdated(tokenAddress);

        emit YearnDeposited(
            tokenAddress,
            address(iVault),
            amount,
            tokenBalanceBeforeDeposit,
            tokenBalanceAfterDeposit
        );
    }
}
