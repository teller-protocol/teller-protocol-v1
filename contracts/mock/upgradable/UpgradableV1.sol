pragma solidity 0.5.17;

import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";

import "../../base/TInitializable.sol";

contract UpgradableV1 is TInitializable {
    uint256 public value;
    using SafeERC20 for IERC20;

    function initialize(uint256 initValue) external isNotInitialized {
        _initialize();

        value = initValue;
    }

    function sendETH(address payable to, uint256 amount) public {
        to.transfer(amount);
    }

    function sendToken(
        address tokenAddress,
        address to,
        uint256 amount
    ) public {
        IERC20(tokenAddress).safeTransfer(to, amount);
    }

    function() external payable {}
}
