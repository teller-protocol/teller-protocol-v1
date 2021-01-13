pragma solidity 0.5.17;

import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/SafeERC20.sol";
import "../interfaces/ISwapper.sol";
import "../util/NumbersLib.sol";
import "./Base.sol";

contract UniswapController is Base, ISwapper {
    using NumbersLib for *;
    using SafeERC20 for IERC20;

    IUniswapV2Router01 private constant ROUTER = IUniswapV2Router01(
        0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D
    );

    IChainlinkAggregator private chainlink;

    uint256 private minAmountOutPercent;

    function initialize(uint256 _minAmountOutPercent) external {
        require(
            _minAmountOutPercent >= 8000 && _minAmountOutPercent < 10000,
            "MIN_AMOUNT_INVALID"
        );

        minAmountOutPercent = _minAmountOutPercent;
        chainlink = _getSettings().chainlinkAggregator();
    }

    function swap(uint256 amountIn, address[] path) external returns (uint256) {
        IERC20 srcToken = IERC20(path[0]);
        srcToken.safeIncreaseAllowance(ROUTER, amountIn);

        uint256[] amounts = ROUTER.swapExactTokensForToken(
            amountIn,
            ROUTER.getAmountsOut(amountIn, path)[path.length - 1],
            path,
            address(this),
            now
        );

        return amounts[amounts.length - 1];
    }
}
