pragma solidity 0.5.17;

/**
    @notice Aave dApp interface. 

    @author develop@teller.finance
 */
interface IAave {
    /**
        @notice This event is emitted every time Aave deposit is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Deposit.
        @param tokenBalanceAfterDeposit underlying token balance after Deposit.
        @param aTokenBalanceAfterDeposit cTokens balance after Deposit.
     */
    event AaveDeposited(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 tokenBalanceAfterDeposit,
        uint256 aTokenBalanceAfterDeposit
    );

    /**
        @notice This event is emitted every time Aave redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param aTokenAddress aave token address.
        @param amount amount of tokens to Withdrawal.
        @param tokenBalanceAfterWithdrawal underlying token balance after Withdrawal.
        @param aTokenBalanceAfterWithdrawal cTokens balance after Withdrawal.
     */
    event AaveWithdrawn(
        address indexed tokenAddress,
        address indexed aTokenAddress,
        uint256 amount,
        uint256 tokenBalanceAfterWithdrawal,
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
}
