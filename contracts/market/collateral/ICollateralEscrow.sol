// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ICollateralEscrow {
    function init(address tokenAddress, bool isWETH) external virtual;

    function deposit(uint256 amount, uint256 loanID) external payable virtual;

    function withdraw(
        uint256 amount,
        uint256 loanID,
        address payable receiver
    ) external virtual;

    function loanSupply(uint256 loanID)
        external
        view
        virtual
        returns (uint256 supply_);

    function totalSupply() external view virtual returns (uint256 supply_);
}
