pragma solidity 0.5.17;

import "./ERC20Mock.sol";

contract DAIMock is ERC20Mock {
    constructor() public ERC20Mock("DAI", "DAI", 18, 1000000000000) {}
}
