// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "./IDestroyable.sol";
import "./EscrowLib.sol";
import "hardhat/console.sol";

contract EscrowLogic {
    function deposit(address account, uint256 amount) external {
        IERC20(s().asset).transferFrom(account, address(this), amount);
        console.log("Received", account);
        console.log(amount);
    }

    function asset() external view returns (address) {
        console.log("In asset");
        return s().asset;
    }

    function hello() external pure returns (string memory) {
        return "world";
    }

    function s() internal pure returns (EscrowLib.Store storage s_) {
        s_ = EscrowLib.store();
    }
}
