pragma solidity 0.5.17;

import "../../base/BaseEscrowDapp.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Burnable.sol";

contract BaseEscrowDappMock is BaseEscrowDapp {
    function clearBalance(address tokenAddress) external {
        ERC20Burnable(tokenAddress).burn(_balanceOf(tokenAddress));
    }

    function externalTokenUpdated(address tokenAddress) external {
        _tokenUpdated(tokenAddress);
    }
}
