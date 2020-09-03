pragma solidity 0.5.17;

/**
    @notice Compound dApp interface. 

    @author develop@teller.finance
 */
interface ICompound {
    /**
        @notice To lend we first have to approve the cToken to access the token balance then mint. 
        @param cTokenAddress address of the token.
        @param amount amount of tokens to mint. 
    */
    function lend(address cTokenAddress, uint256 amount) external;

    /**
        @notice This function calls Compound redeemUnderlying().
        @param cTokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function redeem(address cTokenAddress, uint256 amount) external;

    /**
        @notice This function redeems complete token balance.
        @param cTokenAddress address of the token.
    */
    function redeemAll(address cTokenAddress) external;

    /**
        @notice Returns this contract's balance for the specified token.
        @param cTokenAddress token address.
        @return this contract's balance.
     */
    function balance(address cTokenAddress) external view returns (uint256);

    /**
        @notice This event is emitted every time Compound lend is invoked successfully.
        @param sender the sender of this transaction.
        @param dappAddress address of the compound app.
        @param amount amount of cTokens to Lend.
        @param cToken compound token address.
        @param cTokenBalance cTokens balance after Lend.
        @param underlyingToken address of the underlying token.
        @param underlyingBalance underlying token balance after Lend. 
     */
    event CompoundLended(
        address indexed sender,
        address indexed dappAddress,
        uint256 amount,
        address indexed cToken,
        uint256 cTokenBalance,
        address underlyingToken,
        uint256 underlyingBalance
    );

    /**
        @notice This event is emitted every time Compound redeem is invoked successfully.
        @param sender the sender of this transaction.
        @param dappAddress address of the compound app.
        @param amount amount of cTokens to Redeem.
        @param cToken compound token address.
        @param cTokenBalance cTokens balance after Redeem.
        @param underlyingToken address of the underlying token.
        @param underlyingBalance underlying token balance after Redeem. 
     */
    event CompoundRedeemed(
        address indexed sender,
        address indexed dappAddress,
        uint256 amount,
        address indexed cToken,
        uint256 cTokenBalance,
        address underlyingToken,
        uint256 underlyingBalance
    );
}
