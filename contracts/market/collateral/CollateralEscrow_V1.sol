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

    mapping(address => uint256) public collateralBalances;

    function init(address tokenAddress) external override {
        require(
            address(tokenAddress) != address(0),
            "Teller escrow: collateral token address"
        );
        OwnableUpgradeable.__Ownable_init();
        collateralToken = IERC20(tokenAddress);
    }

    function depositCollateral(uint256 amount, address depositor)
        external
        override
        onlyOwner
    {
        collateralToken.safeTransferFrom(depositor, address(this), amount);
        collateralBalances[depositor] += amount;
    }

    function withdrawCollateral(uint256 amount, address depositor)
        external
        override
        onlyOwner
    {
        require(
            collateralBalances[depositor] <= amount,
            "Teller escrow: Insufficient collateral balance"
        );
        collateralToken.safeTransfer(depositor, amount);
        collateralBalances[depositor] -= amount;
    }
}
