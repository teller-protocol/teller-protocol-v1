pragma solidity 0.5.17;

import "../../../../base/escrow/dapps/Uniswap.sol";
import "./DappMock.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract UniswapMock is DappMock, Uniswap {
    constructor() public {
        Ownable.initialize(msg.sender);
    }

    function() external payable {}
}
