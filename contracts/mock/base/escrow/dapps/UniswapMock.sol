pragma solidity 0.5.17;

import "./UniswapV2Router02Mock.sol";
import "../../../../base/escrow/dapps/Uniswap.sol";
import "./DappMock.sol";

/**
    @notice This mock is used to expose a payable fallback function on tests.f
 */
contract UniswapMock is DappMock, Uniswap {
    IUniswapV2Router02 public router;

    constructor(address wethAddress) public {
        Ownable.initialize(msg.sender);
        router = new UniswapV2Router02Mock(wethAddress);
    }

    function swap(
        address[] memory path,
        uint256 sourceAmount,
        uint256 minDestination
    ) public onlyOwner() {
        _swap(router, path, sourceAmount, minDestination);
    }

    function() external payable {}
}
