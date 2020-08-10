pragma solidity 0.5.17;

import "../../../../base/Escrow/Dapps/Uniswap.sol";

contract UniswapMock is Uniswap {
    constructor(address _router) Uniswap(_router) public {}

    function callSwap(address[] calldata path, uint256 sourceAmount, uint256 minDestination) external {
        swap(path, sourceAmount, minDestination);
    }

    function() external payable {}
}