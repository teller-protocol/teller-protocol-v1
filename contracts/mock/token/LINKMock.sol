pragma solidity 0.5.17;

import "./ERC20Mock.sol";

contract LINKMock is ERC20Mock {

    constructor()
        public ERC20Mock("LINK", "LINK", 18, 1000000000) {}

}
