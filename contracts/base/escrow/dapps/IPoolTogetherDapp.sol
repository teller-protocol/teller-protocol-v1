// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    @notice Pool Together dApp interface.

    @author develop@teller.finance
 */
interface IPoolTogetherDapp {
    /**
        @notice This function deposits the users funds into a Pool Together Prize Pool for a ticket.
        @param tokenAddress address of the token.
        @param amount of tokens to deposit.
    */
    function depositTicket(address tokenAddress, uint256 amount) external;

    /**
        @notice This function withdraws the users funds from a Pool Together Prize Pool.
        @param tokenAddress address of the token.
        @param amount The amount of tokens to withdraw.
    */
    function withdraw(address tokenAddress, uint256 amount) external;

    /**
        @notice This function withdraws the users funds from a Pool Together Prize Pool.
        @param tokenAddress address of the token.
    */
    function withdrawAll(address tokenAddress) external;

    /**
        @notice This event is emitted every time Pool Together depositTo is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param ticketAddress pool ticket token address.
        @param amount amount of tokens deposited.
        @param tokenBalance underlying token balance after depositing.
        @param creditBalanceAfter pool together credit after depositing.
     */
    event PoolTogetherDeposited(
        address indexed tokenAddress,
        address indexed ticketAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 creditBalanceAfter
    );

    /**
        @notice This event is emitted every time Pool Together withdrawInstantlyFrom is invoked successfully.
        @param tokenAddress address of the underlying token.
        @param ticketAddress pool ticket token address.
        @param amount amount of tokens to Redeem.
        @param tokenBalance underlying token balance after Redeem.
        @param creditBalanceAfter pool together credit after depositing.
     */
    event PoolTogetherWithdrawal(
        address indexed tokenAddress,
        address indexed ticketAddress,
        uint256 amount,
        uint256 tokenBalance,
        uint256 creditBalanceAfter
    );
}
