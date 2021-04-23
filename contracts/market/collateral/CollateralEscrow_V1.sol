// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ICollateralEscrow } from "./ICollateralEscrow.sol";
import { IWETH } from "../../shared/interfaces/IWETH.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

contract CollateralEscrow_V1 is OwnableUpgradeable, ICollateralEscrow {
    mapping(uint256 => uint256) internal _balances; // loanID -> collateral
    address public collateralToken;
    bool internal _isWETH;

    function init(address tokenAddress, bool isWETH) external override {
        require(
            tokenAddress != address(0),
            "Teller escrow: collateral token address 0"
        );

        OwnableUpgradeable.__Ownable_init();
        collateralToken = tokenAddress;
        _isWETH = isWETH;
    }

    function deposit(uint256 loanID, uint256 amount)
        external
        payable
        override
        onlyOwner
    {
        if (_isWETH && msg.value > 0) {
            require(msg.value == amount, "Teller: incorrect eth deposit");
            IWETH(collateralToken).deposit{ value: msg.value }();
        } else {
            SafeERC20.safeTransferFrom(
                IERC20(collateralToken),
                msg.sender,
                address(this),
                amount
            );
        }

        _balances[loanID] += amount;
    }

    function withdraw(
        uint256 loanID,
        uint256 amount,
        address payable receiver
    ) external override onlyOwner {
        require(
            _balances[loanID] >= amount,
            "Teller escrow: Insufficient collateral balance"
        );

        SafeERC20.safeTransfer(IERC20(collateralToken), receiver, amount);
        _balances[loanID] -= amount;
    }

    function loanSupply(uint256 loanID)
        external
        view
        override
        returns (uint256 supply_)
    {
        supply_ = _balances[loanID];
    }

    function totalSupply() external view override returns (uint256 supply_) {
        supply_ = IERC20(collateralToken).balanceOf(address(this));
    }
}
