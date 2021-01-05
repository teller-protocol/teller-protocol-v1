pragma solidity 0.5.17;

/**
    @notice This interface defines the different functions available for a UniswapV2Router.
    @author develop@teller.finance
 */
interface IUniswapV2Router02 {
    /**
        @notice It returns the address of the canonical WETH address;
    */
    function WETH() external pure returns (address);

    /**
        @notice Swaps an exact amount of input tokens for as many output tokens as possible, along the route determined by the path. The first element of path is the input token, the last is the output token, and any intermediate elements represent intermediate pairs to trade through (if, for example, a direct pair does not exist).
        @param amountIn The amount of input tokens to send.
        @param amountOutMin The minimum amount of output tokens that must be received for the transaction not to revert.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param to Recipient of the output tokens.
        @param deadline Unix timestamp after which the transaction will revert.
        @return amounts The input token amount and all subsequent output token amounts.
        @dev msg.sender should have already given the router an allowance of at least amountIn on the input token.
     */
    function swapExactTokensForTokens(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
        @notice Swaps an exact amount of tokens for as much ETH as possible, along the route determined by the path. The first element of path is the input token, the last must be WETH, and any intermediate elements represent intermediate pairs to trade through (if, for example, a direct pair does not exist).
        @param amountIn The amount of input tokens to send.
        @param amountOutMin The minimum amount of output tokens that must be received for the transaction not to revert.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param to Recipient of the ETH.
        @param deadline Unix timestamp after which the transaction will revert.
        @return amounts The input token amount and all subsequent output token amounts.
        @dev If the to address is a smart contract, it must have the ability to receive ETH.
     */
    function swapExactTokensForETH(
        uint256 amountIn,
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    /**
        @notice Swaps an exact amount of ETH for as many output tokens as possible, along the route determined by the path. The first element of path must be WETH, the last is the output token, and any intermediate elements represent intermediate pairs to trade through (if, for example, a direct pair does not exist).
        @param amountOutMin The minimum amount of output tokens that must be received for the transaction not to revert.
        @param path An array of token addresses. path.length must be >= 2. Pools for each consecutive pair of addresses must exist and have liquidity.
        @param to Recipient of the output tokens.
        @param deadline Unix timestamp after which the transaction will revert.
        @return amounts The input token amount and all subsequent output token amounts.
     */
    function swapExactETHForTokens(
        uint256 amountOutMin,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);

    function swapTokensForExactTokens(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapTokensForExactETH(
        uint256 amountOut,
        uint256 amountInMax,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external returns (uint256[] memory amounts);

    function swapETHForExactTokens(
        uint256 amountOut,
        address[] calldata path,
        address to,
        uint256 deadline
    ) external payable returns (uint256[] memory amounts);
}
