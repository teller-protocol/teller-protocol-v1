// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// External Libraries
import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interfaces
import "./IUniswapV2Router02.sol";
import "../../interfaces/IPriceAggregator.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE FACET!                             **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT place ANY storage/state variables directly in this contract! If you wish to make        **/
/**  make changes to the state variables used by this contract, do so in its defined Storage        **/
/**  contract that this contract inherits from                                                      **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract is used to swap tokens on Uniswap.
 *
 * @author develop@teller.finance
 */
contract Uniswap {
    using SafeERC20 for IERC20;

    /**
     * @notice Swaps tokens using a given UniswapV2Router.
     * @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
     * @param sourceAmount amount of source token to swap.
     * @param minDestination The minimum amount of output tokens that must be received for the transaction not to revert.
     * @param v2RouterAddress The UniswapV2Router router address to use.
     * @return uint256 The destination amount that was acquired from the swap.
     */
    function swapWithRouter(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination,
        address v2RouterAddress
    ) public returns (uint256) {
        require(path.length >= 2, "UNI_PATH_TOO_SHORT");
        address source = path[0];
        address destination = path[path.length - 1];
        require(source != destination, "UNI_SRC_DST_SAME");

        IERC20(source).safeIncreaseAllowance(v2RouterAddress, sourceAmount);
        uint256[] memory amounts =
            IUniswapV2Router02(v2RouterAddress).swapExactTokensForTokens(
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
