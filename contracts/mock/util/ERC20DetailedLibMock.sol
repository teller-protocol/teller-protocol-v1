pragma solidity 0.5.17;

import "../../util/ERC20DetailedLib.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";


contract ERC20DetailedLibMock {
    using ERC20DetailedLib for ERC20Detailed;

    function tokenTransferFrom(address tokenAddress, address from, uint256 amount)
        external
    {
        ERC20Detailed(tokenAddress).tokenTransferFrom(from, amount);
    }

    function tokenTransfer(address tokenAddress, address recipient, uint256 amount)
        external
    {
        ERC20Detailed(tokenAddress).tokenTransfer(recipient, amount);
    }

    function getAWholeToken(address tokenAddress) external view returns (uint256) {
        return ERC20Detailed(tokenAddress).getAWholeToken();
    }
}
