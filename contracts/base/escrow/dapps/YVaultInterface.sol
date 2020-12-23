pragma solidity 0.5.17;

/**
    @notice Yearn dApp interface. 

    @author develop@teller.finance
 */
interface YVaultInterface {

    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function deposit(address tokenAddress, uint256 amount) external;

    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param tokenAddress The address of the token being deposited
        @param amount The amount of tokens to be deposited into the vault
     */
    function withdraw(address tokenAddress, uint256 amount) external;

    /**
        @notice Returns the price of the Vault's wrapped token, denominated in the unwrapped native token
        @notice Calculation is: nativeTokenBalance/yTokenTotalSupply, 
            - nativeTokenBalance is the current balance of the native token (example DAI) in the Vault
            - yTokenTotalSupply is the total supply of the Vault's wrapped token (example yDAI)
        @param tokenAddress The address of the underlying token for the associated yVault
        @return The token price
     */
    function getPricePerFullShare(address tokenAddress) external;

    /**
        @notice This event is emitted when a yVault deposit is invoked successfully
        @param iVault The address of the yVault
        @param amount The amount of funds to deposit
        @param tokenBalanceAfterDeposit The balance of tokens held after depositing
     */
    event YearnDeposited(
        address tokenAddress,
        address iVault,
        uint256 amount,
        uint256 tokenBalanceAfterDeposit
    );

    /**
        @notice This event is emitted when a yVault withdraw is invoked successfully
        @param underlyingToken The address of the underlying token of the vault
        @param amount The amount of funds to withdraw
        @param tokenBalanceAfterWithdrawl The balance of tokens held after withdrawl
     */
    event YearnWithdrawn(
        address underlyingToken,
        uint256 amount,
        uint256 tokenBalanceAfterWithdrawl
    );
}