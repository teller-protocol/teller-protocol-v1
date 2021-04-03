// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    @notice Compound dApp interface.

    @author develop@teller.finance
 */
interface ICompoundDapp {
    /**
        @notice To lend we first have to approve the cToken to access the token balance then mint.
        @param tokenAddress address of the token.
        @param amount amount of tokens to mint.
    */
    function lend(address tokenAddress, uint256 amount) external;

    /**
        @notice This function calls Compound redeemUnderlying().
        @param tokenAddress address of the token.
        @param amount amount of underlying tokens to redeem.
    */
    function redeem(address tokenAddress, uint256 amount) external;

    /**
        @notice This function redeems complete token balance.
        @param tokenAddress address of the token.
    */
    function redeemAll(address tokenAddress) external;

    /**
        @notice This event is emitted every time Compound lend is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Lend.
        @param tokenBalance underlying token balance after Lend.
        @param cTokenBalance cTokens balance after Lend.
     */
    event CompoundLended(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );

    /**
        @notice This event is emitted every time Compound redeem is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param cTokenAddress compound token address.
        @param amount amount of tokens to Redeem.
        @param isUnderlyingAmount boolean indicating if the amount was in the underlying token.
        @param tokenBalance underlying token balance after Redeem.
        @param cTokenBalance cTokens balance after Redeem.
     */
    event CompoundRedeemed(
        address indexed tokenAddress,
        address indexed cTokenAddress,
        uint256 amount,
        bool isUnderlyingAmount,
        uint256 tokenBalance,
        uint256 cTokenBalance
    );
}
