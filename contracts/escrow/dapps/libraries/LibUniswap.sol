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
import {
    ChainlinkLib
} from "../../../price-aggregator/chainlink/ChainlinkLib.sol";

// Storage
import { AppStorageLib } from "../../../storage/app.sol";

library LibUniswap {
    IUniswapV2Router constant ROUTER =
        IUniswapV2Router(0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D);

    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @dev The source and destination tokens must be supported by the supplied PriceAggregator.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     * @return uint256 The destination amount that was acquired from the swap.
     */
    function swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) internal returns (uint256) {
        require(
            ChainlinkLib.isTokenSupported(path[0]),
            "Teller: uniswap src not supported"
        );
        require(
            ChainlinkLib.isTokenSupported(path[path.length - 1]),
            "Teller: uniswap dst not supported"
        );

        return swapWithRouter(path, sourceAmount, minDestination);
    }

    /**
     * @notice Swaps tokens using a given UniswapV2Router.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     * @return uint256 The destination amount that was acquired from the swap.
     */
    function swapWithRouter(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public returns (uint256) {
        require(path.length >= 2, "Teller: uniswap path too short");
        address source = path[0];
        address destination = path[path.length - 1];

        SafeERC20.safeIncreaseAllowance(
            IERC20(source),
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
