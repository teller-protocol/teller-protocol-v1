pragma solidity 0.5.17;

import "../../../../providers/uniswap/IUniswapV2Router02.sol";
import "../../../../mock/token/ERC20Mock.sol";

contract UniswapV2Router02Mock is IUniswapV2Router02 {
    uint24 public constant DONT_ALTER_BALANCE = 999999;
    uint24 public constant SIMULATE_UNISWAP_RESPONSE_ERROR = 777777;

    address public WETH;

    constructor(address wethAddress) public {
        WETH = wethAddress;
    }

    /**
        @notice This function swaps tokens for tokens.
        @dev We are using amountOutMin special numbers as flags to change behaviour.
     */
    function swapExactTokensForTokens(
        uint256,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        return _swap(amountOutMin, path, to, deadline);
    }

    /**
        @notice This function swaps tokens for WETH tokens.
        @dev https://uniswap.org/docs/v2/smart-contracts/router02/#weth
        @dev We are using amountOutMin special numbers as flags to change behaviour.
     */
    function swapExactTokensForETH(
        uint256,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {
        return _swap(amountOutMin, path, to, deadline);
    }

    /**
        @notice This function swaps ETH for tokens.
        @dev We are using amountOutMin special numbers as flags to change behaviour.
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {
        return _swap(amountOutMin, path, to, deadline);
    }

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {}

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts) {}

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts) {}

    function _swap(
        uint256 amountOutMin,
        address[] memory path,
        address to,
        uint256
    ) internal returns (uint256[] memory amounts) {
        if (SIMULATE_UNISWAP_RESPONSE_ERROR == amountOutMin) {
            amounts = new uint256[](path.length + 1);
        } else {
            amounts = new uint256[](path.length);
        }
        for (uint256 i; i < path.length; i++) {
            amounts[i] = amountOutMin;
        }
        if (!(DONT_ALTER_BALANCE == amountOutMin)) {
            ERC20Mock destinationToken = ERC20Mock(path[path.length - 1]);
            destinationToken.mint(to, amountOutMin);
        }
    }
}
