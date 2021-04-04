// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../../../interfaces/IUniswapV2Router02.sol";
import "../../../data/escrow.sol";

abstract contract ext_swap_with_router is ext_swap_with_router_v1 {}

abstract contract ext_swap_with_router_v1 is dat_Escrow {
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
        require(path.length >= 2, "UNI_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];
        require(source != destination, "UNI_SRC_DST_SAME");

        address UNISWAP_ROUTER =
            IProtocol(PROTOCOL).getUniswapV2RouterAddress();

        IERC20(source).safeIncreaseAllowance(UNISWAP_ROUTER, sourceAmount);
        uint256[] memory amounts =
            IUniswapV2Router02(UNISWAP_ROUTER).swapExactTokensForTokens(
                sourceAmount,
                minDestination,
                path,
                address(this),
                block.timestamp
            );

        require(amounts.length == path.length, "UNI_ERROR_SWAPPING");
        return amounts[amounts.length - 1];
    }
}
