// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ILendingEscrow } from "./ILendingEscrow.sol";

// Libraries

// Interfaces

contract LendingEscrow_V1 is OwnableUpgradeable, ILendingEscrow {
    address public operator;

    modifier onlyOperator {
        require(_msgSender() == operator, "Teller: not lp escrow operator");
        _;
    }

    function init(address _operator) external override {
        OwnableUpgradeable.__Ownable_init();

        operator = _operator;
    }

    function deposit(address from, uint256 amount)
        external
        override
        onlyOperator
    {
        executeStrategy();
    }

    function withdraw(address to, uint256 amount)
        external
        override
        onlyOperator
    {}

    function executeStrategy() public override {}
}
