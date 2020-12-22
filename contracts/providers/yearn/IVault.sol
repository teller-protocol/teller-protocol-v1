pragma solidity ^0.5.17;

/**
    @notice This interface defines the different functions available for a Yearn Vault
    @author develop@teller.finance
 */

interface IVault {
    /**
        @notice Returns the unwrapped native token address that the Vault takes as deposit
        @return The address of the unwrapped token
     */
    function token() external view returns (address);

    /**
        @notice Returns the native underlying token address in Delegated Vaults, example: yDAI in case of a DAI delegated vault
        @return The address of the underlying token
     */
    function underlying() external view returns (address);

    /**
        @notice Returns the vault's wrapped token name as a string, example 'yearn Dai Stablecoin'
        @return The name of the wrapped token
     */
    function name() external view returns (string memory);

    /**
        @notice Returns the vault's wrapped token symbol as a string, example 'yDai'
        @return The symbol of the wrapped token
     */
    function symbol() external view returns (string memory);

    /**
        @notice Returns the amount of decimals for this vault's wrapped token as a uin8
        @return The number of decimals for the token
     */
    function decimals() external view returns (uint8);

    /**
        @notice Returns the address of the Vault's controller
        @return The address of the controller contract
     */
    function controller() external view returns (address);

    /**
        @notice Returns the address of the Vault's governance contract
        @return The contract address
     */
    function governance() external view returns (address);

    /**
        @notice Returns the price of the Vault's wrapped token, denominated in the unwrapped native token
        @notice Calculation is: nativeTokenBalance/yTokenTotalSupply, 
            - nativeTokenBalance is the current balance of the native token (example DAI) in the Vault
            - yTokenTotalSupply is the total supply of the Vault's wrapped token (example yDAI)
        @return The token price
     */
    function getPricePerFullShare() external view returns (uint256);

    /**
        @notice Deposits the specified amount of the native unwrapped token (same as token() returns) into the Vault
        @param uint256 The amount of tokens to deposit
     */
    function deposit(uint256) external;

    /**
        @notice Deposits the maximum available amount of the native wrapped token (same as token() returns) into the Vault
     */
    function depositAll() external;

    /**
        @notice Withdraws the specified amount of the native unwrapped token (same as token() returns) from the Vault
        @param uint256 The amount to withdraw
     */
    function withdraw(uint256) external;

    /**
        @notice Withdraws the maximum available amount of native unwrapped token (same as token() returns) from the Vault
     */
    function withdrawAll() external;
}
