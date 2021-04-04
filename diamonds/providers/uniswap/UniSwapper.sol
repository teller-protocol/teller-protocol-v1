// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "./IUniswapV2Router02.sol";
import "../../domains/protocol/interfaces/IPriceAggregator.sol";
import "../../domains/protocol/address.sol";
import "./Uniswap.sol";

abstract contract UniSwapper {
    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @notice Allows for a custom minimum destination amount to be required.
     * @dev See the swap function below.
     */
    function _uniswap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) internal returns (uint256) {
        return _swap(path, sourceAmount, minDestination);
    }

    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @notice Will check Uniswap via the router what the expected minimum destination amount should be.
     * @dev See the swap function below.
     */
    function _uniswap(address[] memory path, uint256 sourceAmount)
        internal
        returns (uint256)
    {
        uint256 minDestination =
            IUniswapV2Router02(UNISWAP_ROUTER).getAmountsOut(
                sourceAmount,
                path
            )[path.length - 1];
        return _swap(path, sourceAmount, minDestination);
    }

    /**
     * @notice Swaps tokens using UniswapV2Router via the platform defined Uniswap contract.
     * @dev The source and destination tokens must be supported by the supplied PriceAggregator.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     * @return uint256 The destination amount that was acquired from the swap.
     */
    function _swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) private returns (uint256) {
        IPriceAggregator priceAggregator = IPriceAggregator(PROTOCOL);

        require(
            priceAggregator.isTokenSupported(path[0]),
            "UNI_SRC_NOT_SUPPORTED"
        );
        require(
            priceAggregator.isTokenSupported(path[path.length - 1]),
            "UNI_DST_NOT_SUPPORTED"
        );

        return Uniswap.swapWithRouter(path, sourceAmount, minDestination);
    }
}
