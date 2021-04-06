// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./swap.sol";

abstract contract int_uniswap_v1 is int_swap {
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
}

abstract contract int_uniswap is int_uniswap_v1 {}
