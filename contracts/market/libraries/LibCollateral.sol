// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import { IEscrow } from "../../shared/interfaces/IEscrow.sol";
import { IWETH } from "../../shared/interfaces/IWETH.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Storage
import { AppStorageLib } from "../../storage/app.sol";
import { MarketStorageLib, Loan } from "../../storage/market.sol";

library LibCollateral {
    function l(uint256 loanID) internal pure returns (Loan storage l_) {
        l_ = MarketStorageLib.store().loans[loanID];
    }

    /**
     * @notice This event is emitted when collateral has been deposited for the loan
     * @param loanID ID of the loan for which collateral was deposited
     * @param borrower Account address of the borrower
     * @param depositAmount Amount of collateral deposited
     */
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    /**
     * @notice This event is emitted when collateral has been withdrawn
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param recipient Account address of the recipient
     * @param amount Value of collateral withdrawn
     */
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 amount
    );

    function depositCollateral(uint256 loanID, uint256 amount) internal {
        require(amount > 0, "Teller: zero deposit");

        // Check if ETH deposit and wrap in WETH
        if (msg.value > 0) {
            require(msg.value == amount, "Teller: incorrect eth deposit");
            IWETH(l(loanID).collateralToken).deposit{ value: amount }();
        }
        // TODO: transfer collateral to token escrow

        l(loanID).collateral += amount;
        l(loanID).lastCollateralIn = block.timestamp;

        emit CollateralDeposited(loanID, msg.sender, amount);
    }

    function withdrawCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        l(loanID).collateral -= amount;

        // TODO: withdraw collateral from token escrow
        // Check if ETH deposit and wrap in WETH
        address weth = AppStorageLib.store().assetAddresses["WETH"];
        if (weth == l(loanID).collateralToken) {
            IWETH(weth).withdraw(amount);
            recipient.transfer(amount);
        } else {
            //            SafeERC20.safeTransferFrom(
            //                IERC20(l(loanID).collateralToken),
            //                escrow,
            //                recipient,
            //                amount
            //            );
        }

        emit CollateralWithdrawn(
            loanID,
            l(loanID).loanTerms.borrower,
            recipient,
            amount
        );
    }

    /**
     * @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
     * @dev See Escrow.claimTokens for more info.
     * @param loanID The ID of the loan which is being liquidated
     * @param rewardInCollateral The total amount of reward based in the collateral token to pay the liquidator
     * @param recipient The address of the liquidator where the liquidation reward will be sent to
     */
    function payOutLiquidator(
        uint256 loanID,
        int256 rewardInCollateral,
        address payable recipient
    ) internal {
        if (rewardInCollateral <= 0) {
            return;
        }
        uint256 reward = uint256(rewardInCollateral);
        if (reward < MarketStorageLib.store().loans[loanID].collateral) {
            withdrawCollateral(loanID, reward, recipient);
        } else if (
            reward >= MarketStorageLib.store().loans[loanID].collateral
        ) {
            uint256 remainingCollateralAmount =
                reward - (MarketStorageLib.store().loans[loanID].collateral);
            withdrawCollateral(
                loanID,
                MarketStorageLib.store().loans[loanID].collateral,
                recipient
            );
            if (
                remainingCollateralAmount > 0 &&
                MarketStorageLib.store().escrows[loanID] != address(0x0)
            ) {
                IEscrow(MarketStorageLib.store().escrows[loanID])
                    .claimTokensByCollateralValue(
                    recipient,
                    remainingCollateralAmount
                );
            }
        }
    }
}
