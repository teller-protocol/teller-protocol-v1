// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILendingEscrow {
    function init(address _operator) external virtual;

    function deposit(address from, uint256 amount) external virtual;

    function withdraw(address to, uint256 amount) external virtual;

    function executeStrategy() external virtual;
}
