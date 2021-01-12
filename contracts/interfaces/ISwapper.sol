pragma solidity 0.5.17;

contract ISwapper {
    string public constant SWAP_SIGNATURE = "swap(uint256,address[])";

    function swap(uint256 amountIn, address[] calldata path)
        external
        returns (uint256 amountOut);
}
