// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract int_tokenBalanceOf_Escrow_v1 {
    function _balanceOf(address token) internal view returns (uint256) {
        return IERC20(token).balanceOf(address(this));
    }
}

abstract contract int_tokenBalanceOf_Escrow is int_tokenBalanceOf_Escrow_v1 {}
