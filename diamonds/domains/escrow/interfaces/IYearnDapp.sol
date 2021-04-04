// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    @notice Yearn dApp interface.

    @author develop@teller.finance
 */
interface IYearnDapp {
    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function deposit(address tokenAddress, uint256 amount) external;

    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param tokenAddress The address of the underlying token being withdrawn
        @param amount The amount of tokens to be withdrawn into the vault
     */
    function withdraw(address tokenAddress, uint256 amount) external;

    /**
        @notice Withdraws all the deposited tokens (same as token() returns) from the Vault
        @param tokenAddress The address of the underlying token being withdrawn
     */
    function withdrawAll(address tokenAddress) external;

    /**
        @notice Returns the price of the Vault's wrapped token, denominated in the unwrapped native token
        @notice Calculation is: nativeTokenBalance/yTokenTotalSupply,
            - nativeTokenBalance is the current balance of the native token (example DAI) in the Vault
            - yTokenTotalSupply is the total supply of the Vault's wrapped token (example yDAI)
        @param tokenAddress The address of the underlying token for the associated yVault
        @return uint256 The token price
     */
    function getPricePerFullShare(address tokenAddress)
        external
        view
        returns (uint256);

    /**
        @notice This event is emitted when a yVault deposit is invoked successfully
        @param iVault The address of the yVault
        @param amount The amount of funds to deposit
        @param tokenBalanceBeforeDeposit The balance of tokens held after depositing
        @param tokenBalanceAfterDeposit The balance of tokens held after depositing
     */
    event YearnDeposited(
        address tokenAddress,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceBeforeDeposit,
        uint256 tokenBalanceAfterDeposit
    );

    /**
        @notice This event is emitted when a yVault withdraw is invoked successfully
        @param underlyingToken The address of the underlying token of the vault
        @param iVault The address of the yVault
        @param amount The amount of funds to withdraw
        @param tokenBalanceBeforeWithdrawal The balance of tokens held before withdrawal
        @param tokenBalanceAfterWithdrawal The balance of tokens held after withdrawal
     */
    event YearnWithdrawn(
        address underlyingToken,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceBeforeWithdrawal,
        uint256 tokenBalanceAfterWithdrawal
    );
}
