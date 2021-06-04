// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    IUniswapV2Router
} from "../../../shared/interfaces/IUniswapV2Router.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library LibUniswap {
    IUniswapV2Router constant ROUTER =
        IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /**
     * @notice Swaps tokens for tokens on Uniswap.
     * @dev {path} must have at least 2 token addresses
     * @param path An array of token addresses.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     * @return amounts is the resulting number of tokens swapped for
     */
    function swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) internal returns (uint256) {
        SafeERC20.safeIncreaseAllowance(
            IERC20(path[0]),
            address(ROUTER),
            sourceAmount
        );
        uint256[] memory amounts =
            ROUTER.swapExactTokensForTokens(
                sourceAmount,
                minDestination,
                path,
                address(this),
                block.timestamp
            );

        return amounts[amounts.length - 1];
    }
}
