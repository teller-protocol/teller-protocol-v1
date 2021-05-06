// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICollateralEscrow {
    function init(address tokenAddress, bool isWETH) external;

    function deposit(uint256 loanID, uint256 amount) external payable;

    function withdraw(
        uint256 loanID,
        uint256 amount,
        address payable receiver
    ) external;

    function loanSupply(uint256 loanID) external view returns (uint256 supply_);

    function totalSupply() external view returns (uint256 supply_);
}
