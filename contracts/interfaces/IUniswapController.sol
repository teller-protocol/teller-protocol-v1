pragma solidity 0.5.17;

interface IUniswapController {
    function initialize(
        address factoryAddress,
        address routerAddress,
        uint256 _minAmountOutPercent
    ) external;

    function swap(uint256 amountIn, address[] calldata path)
        external
        returns (uint256 amountOut);
}
