// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/pool-ticket.sol";

abstract contract ent_withdraw_all is ent_withdraw_all_v1 {}

abstract contract ent_withdraw_all_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_pool_ticket
{
    /**
        @notice This function withdraws the users funds from a Pool Together Prize Pool.
        @param tokenAddress address of the token.
    */
    function withdrawAll(address tokenAddress) public override onlyOwner {
        PrizePoolInterface prizePool = _getPrizePool(tokenAddress);

        address ticketAddress = _getTicketAddress(tokenAddress);

        uint256 balanceBefore = _balanceOf(ticketAddress);

        (uint256 maxExitFee, ) =
            prizePool.calculateEarlyExitFee(
                address(this),
                ticketAddress,
                balanceBefore
            );
        prizePool.withdrawInstantlyFrom(
            address(this),
            balanceBefore,
            ticketAddress,
            maxExitFee
        );

        uint256 balanceAfter = _balanceOf(ticketAddress);
        require(balanceAfter < balanceBefore, "WITHDRAW_ERROR");

        _tokenUpdated(address(ticketAddress));
        _tokenUpdated(tokenAddress);

        emit PoolTogetherWithdrawal(
            tokenAddress,
            ticketAddress,
            balanceBefore,
            _balanceOf(tokenAddress),
            balanceAfter
        );
    }
}
