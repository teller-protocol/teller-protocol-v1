// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/pool-ticket.sol";

abstract contract ent_deposit_ticket is ent_deposit_ticket_v1 {}

abstract contract ent_deposit_ticket_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_pool_ticket
{
    /**
        @notice This function deposits the users funds into a Pool Together Prize Pool for a ticket.
        @param tokenAddress address of the token.
        @param amount of tokens to deposit.
    */
    function depositTicket(address tokenAddress, uint256 amount)
        public
        override
        onlyOwner
    {
        require(
            _balanceOf(tokenAddress) >= amount,
            "POOL_INSUFFICIENT_UNDERLYING"
        );

        PrizePoolInterface prizePool = _getPrizePool(tokenAddress);

        address ticketAddress = _getTicketAddress(tokenAddress);
        uint256 balanceBefore = _balanceOf(ticketAddress);
        IERC20(tokenAddress).safeApprove(address(prizePool), amount);

        prizePool.depositTo(
            address(this),
            amount,
            ticketAddress,
            address(this)
        );

        uint256 balanceAfter = _balanceOf(ticketAddress);
        require(balanceAfter > balanceBefore, "DEPOSIT_ERROR");

        _tokenUpdated(address(ticketAddress));
        _tokenUpdated(tokenAddress);

        emit PoolTogetherDeposited(
            tokenAddress,
            ticketAddress,
            amount,
            _balanceOf(tokenAddress),
            balanceAfter
        );
    }
}
