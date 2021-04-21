// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { ICollateralEscrow } from "./ICollateralEscrow.sol";

contract CollateralEscrow_V1 is OwnableUpgradeable, ICollateralEscrow {
    using SafeERC20 for IERC20;
    IERC20 public collateralToken;

    mapping(uint256 => uint256) public collateralBalances; // loanID -> collateral

    function init(address tokenAddress) external override {
        require(
            tokenAddress != address(0),
            "Teller escrow: collateral token address 0"
        );
        OwnableUpgradeable.__Ownable_init();
        collateralToken = IERC20(tokenAddress);
    }

    function depositCollateral(uint256 amount, uint256 loanID)
        external
        override
        onlyOwner
    {
        collateralToken.safeTransferFrom(msg.sender, address(this), amount);
        collateralBalances[loanID] += amount;
    }

    function withdrawCollateral(
        uint256 amount,
        uint256 loanID,
        address receiver
    ) external override onlyOwner {
        require(
            collateralBalances[loanID] >= amount,
            "Teller escrow: Insufficient collateral balance"
        );
        collateralToken.safeTransfer(receiver, amount);
        collateralBalances[loanID] -= amount;
    }
}
