pragma solidity 0.5.17;

import "@uniswap/v2-core/contracts/interfaces/IUniswapV2Factory.sol";
import "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router01.sol";

contract IUniswapController {
    IUniswapV2Factory public factory;
    IUniswapV2Router01 public router;
    IChainlinkAggregator private chainlink;
    uint256 private minAmountOutPercent;

    function initialize(
        address factoryAddress,
        address routerAddress,
        uint256 _minAmountOutPercent
    ) external;

    function swap(uint256 amountIn, address[] path) external;
}
