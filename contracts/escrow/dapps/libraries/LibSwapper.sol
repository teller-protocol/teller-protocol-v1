// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IUniswapV2Router } from "../../../shared/interfaces/IUniswapV2Router.sol";

// Libraries
import { SafeERC20 } from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

library LibSwapper {
    /**
     * @notice Swaps tokens for tokens on Sushiswap.
     * @dev {path} must have at least 2 token addresses
     * @param routerAddress The address of the swapping router (UniswapV2Router, SushiswapV2Router, etc)
     * @param path An array of token addresses.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     */
    function swap(
        address routerAddress,
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) internal returns (uint256) {
        SafeERC20.safeIncreaseAllowance(
            IERC20(path[0]),
            routerAddress,
            sourceAmount
        );
        uint256[] memory amounts = IUniswapV2Router(routerAddress)
        .swapExactTokensForTokens(
            sourceAmount,
            minDestination,
            path,
            address(this),
            block.timestamp
        );

        return amounts[amounts.length - 1];
    }
}
