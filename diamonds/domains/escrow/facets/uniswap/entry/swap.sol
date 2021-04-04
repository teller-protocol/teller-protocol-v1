// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    mod_onlyOwner_AccessControl
} from "../../../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "../../../internal/token-updated.sol";
import "../internal/uniswap.sol";

abstract contract ent_swap is ent_swap_v1 {}

abstract contract ent_swap_v1 is
    mod_onlyOwner_AccessControl,
    int_tokenUpdated_Escrow,
    int_uniswap
{
    /**
        @notice Swaps ETH/Tokens for Tokens/ETH using different Uniswap v2 Router 02 methods.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param sourceAmount amount of source token to swap.
        @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public override onlyOwner {
        uint256 destinationAmount =
            _uniswap(path, sourceAmount, minDestination);

        _tokenUpdated(path[0]);
        _tokenUpdated(path[path.length - 1]);

        emit UniswapSwapped(
            path[0],
            path[path.length - 1],
            sourceAmount,
            destinationAmount
        );
    }
}
