pragma solidity 0.5.17;

import "./ERC20Mock.sol";

contract WETHMock is ERC20Mock {
    constructor() public ERC20Mock("WETH", "WETH", 18, 1000000000000) {}
}
