pragma solidity 0.5.17;

/**
    @notice Compound dApp interface. 
 */
interface ICompound {
     /**
        @notice This event is emitted every time Compound lend is invoked.
        @param sender the sender of this transaction.
        @param dappAddress address of the compound app.
        @param cToken compound token address.
        @param underlyingToken address of the underlying token.
        @param amount the amount to redeem. 
     */
    event CompoundLended(
        address indexed sender,
        address indexed dappAddress,
        address indexed cToken,
        address underlyingToken,
        uint256 amount 
    );

    /**
        @notice This event is emitted every time Compound redeem is invoked.
        @param sender the sender of this transaction.
        @param dappAddress address of the compound app.
        @param cToken compound token address.
        @param underlyingToken address of the underlying token.
        @param amount the amount to redeem. 
     */
    event CompoundRedeemed(
        address indexed sender,
        address indexed dappAddress,
        address indexed cToken,
        address underlyingToken,
        uint256 amount
    );



}