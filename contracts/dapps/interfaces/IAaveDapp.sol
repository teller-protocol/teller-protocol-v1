// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    @notice Aave dApp interface.

    @author develop@teller.finance
 */
interface IAaveDapp {
    /**
        @notice This event is emitted every time Aave deposit is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Deposit.
        @param aTokenBalanceBeforeDeposit aTokens balance after Deposit.
        @param aTokenBalanceAfterDeposit aTokens balance after Deposit.
     */
    event AaveDeposited(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 aTokenBalanceBeforeDeposit,
        uint256 aTokenBalanceAfterDeposit
    );

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
        @notice The deposit, the aToken needs to be approved to have access to the token balance
        @param tokenAddress address of the token
        @param amount amount of tokens to deposit
     */
    function deposit(address tokenAddress, uint256 amount) external;

    /**
        @notice This function withdraws the user's aTokens for a specific amount
        @param tokenAddress address of the token
        @param amount amount of the underlying tokens to withdraw
     */
    function withdraw(address tokenAddress, uint256 amount) external;

    /**
        @notice This function withdraws all the user's aTokens from previous deposits
        @param tokenAddress address of the token
     */
    function withdrawAll(address tokenAddress) external;
}
