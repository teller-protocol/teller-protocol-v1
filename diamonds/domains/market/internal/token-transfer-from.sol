// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../storage/lending-pool.sol";

abstract contract int_tokenTransferFrom_Market_v1 is sto_LendingPool {
    using SafeERC20 for ERC20;

    function tokenTransferFrom(address from, uint256 amount)
        internal
        returns (uint256 difference)
    {
        ERC20 lendingToken = ERC20(getLendingPool().lendingToken);
        uint256 balanceBefore = lendingToken.balanceOf(address(this));
        uint256 allowance = lendingToken.allowance(from, address(this));
        require(allowance >= amount, "NOT_ENOUGH_ALLOWANCE");
        lendingToken.safeTransferFrom(from, address(this), amount);
        return lendingToken.balanceOf(address(this)) - (balanceBefore);
    }
}
