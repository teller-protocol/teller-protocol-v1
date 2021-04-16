// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Interfaces
import { ILendingEscrow } from "./ILendingEscrow.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

contract LendingEscrow_V1 is OwnableUpgradeable, ILendingEscrow {
    address public operator;

    IERC20 public asset;

    ICErc20 public cToken;

    modifier onlyOperator {
        require(_msgSender() == operator, "Teller: not lp escrow operator");
        _;
    }

    function init(
        address _operator,
        address _asset,
        address _cToken
    ) external override {
        OwnableUpgradeable.__Ownable_init();

        operator = _operator;
        asset = IERC20(_asset);
        cToken = ICErc20(_cToken);
    }

    function onTransfer() external override {
        _deposit(asset.balanceOf(address(this)));
    }

    function deposit(address from, uint256 amount) external override {
        SafeERC20.safeTransferFrom(asset, from, address(this), amount);
        _deposit(amount);
    }

    function _deposit(uint256 amount) internal {
        SafeERC20.safeApprove(asset, address(cToken), amount);
        cToken.mint(amount);
    }

    function withdraw(address to, uint256 amount)
        external
        override
        onlyOperator
    {
        cToken.redeemUnderlying(amount);
        SafeERC20.safeTransfer(asset, to, amount);
    }
}
