pragma solidity 0.5.17;

import "../../../../base/Escrow/Dapps/Compound.sol";

contract CompoundMock is Compound {
    function callLend(address cTokenAddress, uint256 amount) external {
        lend(cTokenAddress, amount);
    }

    function callRedeem(address cTokenAddress) external {
        redeem(cTokenAddress);
    }
    function callRedeem(address cTokenAddress, uint256 amount) external {
        redeem(cTokenAddress, amount);
    }

    function() external payable {}
}