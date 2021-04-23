// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";

// Interfaces
import { ILoansEscrow } from "./ILoansEscrow.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LoansEscrow_V1 is OwnableUpgradeable, ILoansEscrow {
    function init() external override {
        OwnableUpgradeable.__Ownable_init();
    }

    function callDapp(address dappAddress, bytes calldata dappData)
        external
        override
        onlyOwner
    {}

    function claimToken(
        address token,
        address to,
        uint256 amount
    ) external override onlyOwner {
        SafeERC20.safeTransfer(IERC20(token), to, amount);
    }
}
