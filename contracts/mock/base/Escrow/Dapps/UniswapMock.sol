pragma solidity 0.5.17;

import "../../../../base/Escrow/Dapps/Uniswap.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract UniswapMock is Uniswap {

    function() external payable {}

    function callSwap(
        address weth,
        address router,
        address[] calldata path,
        uint256 sourceAmount,
        uint256 minDestination
    ) external {
        swap(weth, router, path, sourceAmount, minDestination);
    }

}