// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { MarketStorageLib } from "../../storage/market.sol";
import { IEscrow } from "../../shared/interfaces/IEscrow.sol";

library LibCollateral {
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

    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        require(msg.value == amount, "INCORRECT_ETH_AMOUNT");

        MarketStorageLib.marketStore().totalCollateral += amount;
        MarketStorageLib.marketStore().loans[loanID].collateral += amount;
        MarketStorageLib.marketStore().loans[loanID].lastCollateralIn = block
            .timestamp;
        emit CollateralDeposited(loanID, msg.sender, amount);
    }

    function _withdrawCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        _payOutCollateral(loanID, amount, recipient);

        emit CollateralWithdrawn(
            loanID,
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            recipient,
            amount
        );
    }

    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        MarketStorageLib.marketStore().totalCollateral =
            MarketStorageLib.marketStore().totalCollateral -
            (amount);
        MarketStorageLib.marketStore().loans[loanID].collateral =
            MarketStorageLib.marketStore().loans[loanID].collateral -
            (amount);
        recipient.transfer(amount);
    }

    /**
     * @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
     * @dev See Escrow.claimTokens for more info.
     * @param loanID The ID of the loan which is being liquidated
     * @param rewardInCollateral The total amount of reward based in the collateral token to pay the liquidator
     * @param recipient The address of the liquidator where the liquidation reward will be sent to
     */
    function _payOutLiquidator(
        uint256 loanID,
        int256 rewardInCollateral,
        address payable recipient
    ) internal {
        if (rewardInCollateral <= 0) {
            return;
        }
        uint256 reward = uint256(rewardInCollateral);
        if (reward < MarketStorageLib.marketStore().loans[loanID].collateral) {
            _payOutCollateral(loanID, reward, recipient);
        } else if (
            reward >= MarketStorageLib.marketStore().loans[loanID].collateral
        ) {
            uint256 remainingCollateralAmount =
                reward -
                    (MarketStorageLib.marketStore().loans[loanID].collateral);
            _payOutCollateral(
                loanID,
                MarketStorageLib.marketStore().loans[loanID].collateral,
                recipient
            );
            if (
                remainingCollateralAmount > 0 &&
                MarketStorageLib.marketStore().loans[loanID].escrow !=
                address(0x0)
            ) {
                IEscrow(MarketStorageLib.marketStore().loans[loanID].escrow)
                    .claimTokensByCollateralValue(
                    recipient,
                    remainingCollateralAmount
                );
            }
        }
    }
}
