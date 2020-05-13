pragma solidity 0.5.17;

import "./ERC20Mock.sol";

contract USDCMock is ERC20Mock {

    constructor()
        public ERC20Mock("USDC", "USDC", 6, 1000000000000) {}

}
