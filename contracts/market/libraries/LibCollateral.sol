// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ICollateralEscrow } from "../collateral/ICollateralEscrow.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";
import { MarketStorageLib } from "../../storage/market.sol";

library LibCollateral {
    /**
     * @notice This event is emitted when collateral has been deposited for the loan
     * @param loanID ID of the loan for which collateral was deposited
     * @param depositor Account that deposited funds
     * @param amount Amount of collateral deposited
     */
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed depositor,
        uint256 amount
    );

    /**
     * @notice This event is emitted when collateral has been withdrawn
     * @param loanID ID of loan from which collateral was withdrawn
     * @param receiver Account that received funds
     * @param amount Value of collateral withdrawn
     */
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed receiver,
        uint256 amount
    );

    function e(uint256 loanID) internal view returns (ICollateralEscrow c_) {
        c_ = MarketStorageLib.store().collateralEscrows[
            MarketStorageLib.store().loans[loanID].collateralToken
        ];
    }

    function e(address token) internal view returns (ICollateralEscrow c_) {
        c_ = MarketStorageLib.store().collateralEscrows[token];
    }

    function deposit(uint256 loanID, uint256 amount) internal {
        e(loanID).deposit{ value: amount }(loanID, amount);

        emit CollateralDeposited(loanID, msg.sender, amount);
    }

    function withdraw(
        uint256 loanID,
        uint256 amount,
        address payable receiver
    ) internal {
        e(loanID).withdraw(loanID, amount, receiver);

        emit CollateralWithdrawn(loanID, receiver, amount);
    }

    function withdrawAll(uint256 loanID, address payable receiver) internal {
        withdraw(loanID, e(loanID).loanSupply(loanID), receiver);
    }

    function createEscrow(address token) internal {
        // Check if collateral escrow exists
        if (address(e(token)) == address(0)) {
            // Create escrow
            address escrow =
                AppStorageLib.store().collateralEscrowBeacon.cloneProxy("");
            ICollateralEscrow(escrow).init(
                token,
                // Check if collateral token is WETH
                token == AppStorageLib.store().assetAddresses["WETH"]
            );

            // Set max allowance
            IERC20(token).approve(escrow, type(uint256).max);
            // Save escrow address for loan
            MarketStorageLib.store().collateralEscrows[
                token
            ] = ICollateralEscrow(escrow);
        }
    }
}
