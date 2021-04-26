// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MarketStorageLib, MarketStorage } from "../../../storage/market.sol";
import { AppStorageLib } from "../../../storage/app.sol";
import { IAToken } from "../interfaces/IAToken.sol";
import { IAaveLendingPool } from "../interfaces/IAaveLendingPool.sol";
import {
    IAaveLendingPoolAddressesProvider
} from "../interfaces/IAaveLendingPoolAddressesProvider.sol";
import "../../../storage/app.sol";
import {
    IUniswapV2Router
} from "../../../shared/interfaces/IUniswapV2Router.sol";
import { IVault } from "../interfaces/IVault.sol";

import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library LibDapps {
    using SafeERC20 for IERC20;

    function s() internal pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    /**
        @notice Grabs the Aave lending pool instance from the Aave lending pool address provider
        @return IAaveLendingPool instance address
     */
    function getAaveLendingPool() internal view returns (IAaveLendingPool) {
        return
            IAaveLendingPool(
                IAaveLendingPoolAddressesProvider(
                    0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5
                )
                    .getLendingPool()
            ); // LP address provider contract is immutable and the address will never change
    }

    /**
        @notice Grabs the aToken instance from the lending pool
        @param tokenAddress The underlying asset address to get the aToken for
        @return IAToken instance
     */
    function getAToken(address tokenAddress) internal view returns (IAToken) {
        return
            IAToken(
                getAaveLendingPool().getReserveData(tokenAddress).aTokenAddress
            );
    }

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
            AppStorageLib.store().priceAggregator.isTokenSupported(path[0]),
            "UNI_SRC_NOT_SUPPORTED"
        );
        require(
            AppStorageLib.store().priceAggregator.isTokenSupported(
                path[path.length - 1]
            ),
            "UNI_DST_NOT_SUPPORTED"
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
    ) internal returns (uint256) {
        require(path.length >= 2, "UNI_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];
        require(source != destination, "UNI_SRC_DST_SAME");

        IUniswapV2Router uniRouter = AppStorageLib.store().uniswapRouter;

        IERC20(source).safeIncreaseAllowance(address(uniRouter), sourceAmount);
        uint256[] memory amounts =
            uniRouter.swapExactTokensForTokens(
                sourceAmount,
                minDestination,
                path,
                address(this),
                block.timestamp
            );

        require(amounts.length == path.length, "UNI_ERROR_SWAPPING");
        return amounts[amounts.length - 1];
    }

    /**
        @notice Grabs the yVault address for a token from the asset settings
        @param tokenAddress The underlying token address for the associated yVault
        @return yVault instance
     */
    function getYVault(address tokenAddress) internal view returns (IVault) {
        return
            IVault(
                AppStorageLib.store().assetSettings[tokenAddress].addresses[
                    keccak256("yVaultAddress")
                ]
            );
    }
}
