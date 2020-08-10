pragma solidity 0.5.17;

import "../../util/ERC20Lib.sol";
import "../../providers/openzeppelin/ERC20.sol";


contract ERC20LibMock {
    using ERC20Lib for ERC20;

    function tokenTransferFrom(address tokenAddress, address from, uint256 amount)
        external
    {
        ERC20(tokenAddress).tokenTransferFrom(from, amount);
    }

    function tokenTransfer(address tokenAddress, address recipient, uint256 amount)
        external
    {
        ERC20(tokenAddress).tokenTransfer(recipient, amount);
    }

    function getAWholeToken(address tokenAddress) external view returns (uint256) {
        return ERC20(tokenAddress).getAWholeToken();
    }
}
