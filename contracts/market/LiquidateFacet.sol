// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Libraries
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";

// Storage
import { MarketStorageLib, LoanStatus } from "../storage/market.sol";

contract LiquidateFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice This event is emitted when a loan has been successfully liquidated
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param liquidator Account address of the liquidator
     * @param collateralOut Collateral that is sent to the liquidator
     * @param tokensIn Percentage of the collateral price paid by the liquidator to the lending pool
     */
    event LoanLiquidated(
        uint256 indexed loanID,
        address indexed borrower,
        address liquidator,
        uint256 collateralOut,
        uint256 tokensIn
    );

    /**
     * @notice Liquidate a loan if it is expired or under collateralized
     * @param loanID The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID)
        external
        nonReentry("")
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        require(LibLoans.isLiquidable(loanID), "DOESNT_NEED_LIQUIDATION");

        int256 rewardInCollateral = LibLoans.getLiquidationReward(loanID);

        // the liquidator pays the amount still owed on the loan
        uint256 amountToLiquidate =
            MarketStorageLib.marketStore().loans[loanID].principalOwed +
                (MarketStorageLib.marketStore().loans[loanID].interestOwed);

        LendingLib.repay(
            loanID,
            MarketStorageLib.marketStore().loans[loanID].principalOwed,
            MarketStorageLib.marketStore().loans[loanID].interestOwed,
            msg.sender
        );

        MarketStorageLib.marketStore().loans[loanID].status = LoanStatus.Closed;
        MarketStorageLib.marketStore().loans[loanID].liquidated = true;

        // the caller gets the collateral from the loan
        LibCollateral._payOutLiquidator(
            loanID,
            rewardInCollateral,
            payable(msg.sender)
        );

        emit LoanLiquidated(
            loanID,
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            msg.sender,
            uint256(rewardInCollateral),
            amountToLiquidate
        );
    }
}
