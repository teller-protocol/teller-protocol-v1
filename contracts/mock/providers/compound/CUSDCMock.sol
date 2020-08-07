pragma solidity 0.5.17;

import "./CERC20Mock.sol";


contract CUSDCMock is CERC20Mock {
    constructor(address underlyingToken, uint256 multiplierValue)
        public
        CERC20Mock("CUSDC", "CUSDC", CTOKEN_DECIMALS, underlyingToken, multiplierValue)
    {}
}
