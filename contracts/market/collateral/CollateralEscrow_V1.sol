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

    /**
     * @notice it initializes an escrow
     * @param tokenAddress the address of the collateral token to be stored
     * @param isWETH check if it's wrapped Ethereum
     */
    function init(address tokenAddress, bool isWETH) external override {
        require(
            tokenAddress != address(0),
            "Teller escrow: collateral token address 0"
        );

        OwnableUpgradeable.__Ownable_init();
        collateralToken = tokenAddress;
        _isWETH = isWETH;
    }

    /**
     * @notice it deposits an amount of the respective collateral token into the escrow
     * @param loanID the ID of the loan
     * @param amount the amount of collateral tokens to be deposited
     */
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

    /**
     * @notice it withdraws an amount of tokens in a respective loanID on behalf of the borrower
     * @dev only the TellerDiamond can make this call on behalf of the borrower
     * @param loanID identifier of the loan
     * @param amount number of collateral tokens to send
     * @param receiver payable address to transfer money to
     */
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

    /**
     * @notice it returns the supply of collateral of the respective loan
     * @param loanID the respective loan ID
     * @return supply_ the amount in collateral of the respective loan
     */
    function loanSupply(uint256 loanID)
        external
        view
        override
        returns (uint256 supply_)
    {
        supply_ = _balances[loanID];
    }

    /**
     * @notice it returns the total supply of the collateral token held by the contract
     * @return supply_ the total amount of collateral
     */
    function totalSupply() external view override returns (uint256 supply_) {
        supply_ = IERC20(collateralToken).balanceOf(address(this));
    }
}
