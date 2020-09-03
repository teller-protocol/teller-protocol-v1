pragma solidity 0.5.17;

import "../../../../base/escrow/dapps/Uniswap.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract UniswapMock is Uniswap {
    function() external payable {}
}
