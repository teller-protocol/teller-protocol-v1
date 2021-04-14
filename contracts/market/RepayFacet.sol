// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import {
    MarketStorageLib,
    LoanStatus,
    LendingPool
} from "../storage/market.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LibLendingPool } from "../lending/libraries/LibLendingPool.sol";

contract RepayFacet is RolesMods, PausableMods {
    /**
        @notice This event is emitted when a loan has been successfully repaid
        @param loanID ID of loan from which collateral was withdrawn
        @param borrower Account address of the borrower
        @param amountPaid Amount of the loan paid back
        @param payer Account address of the payer
        @param totalOwed Total amount of the loan to be repaid
     */
    event LoanRepaid(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountPaid,
        address payer,
        uint256 totalOwed
    );

    /**
     * @notice Make a payment to a loan
     * @param amount The amount of tokens to pay back to the loan
     * @param loanID The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID)
        external
        //        nonReentrant
        //        loanActiveOrSet(loanID)
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        require(amount > 0, "AMOUNT_VALUE_REQUIRED");
        // calculate the actual amount to repay
        uint256 totalOwed = LibLoans.getTotalOwed(loanID);
        if (totalOwed < amount) {
            amount = totalOwed;
        }
        // update the amount owed on the loan
        totalOwed = totalOwed - amount;

        // Deduct the interest and principal owed
        uint256 principalPaid;
        uint256 interestPaid;
        if (
            amount < MarketStorageLib.marketStore().loans[loanID].interestOwed
        ) {
            interestPaid = amount;
            MarketStorageLib.marketStore().loans[loanID].interestOwed =
                MarketStorageLib.marketStore().loans[loanID].interestOwed -
                (amount);
        } else {
            if (MarketStorageLib.marketStore().loans[loanID].interestOwed > 0) {
                interestPaid = MarketStorageLib.marketStore().loans[loanID]
                    .interestOwed;
                amount = amount - interestPaid;
                MarketStorageLib.marketStore().loans[loanID].interestOwed = 0;
            }

            if (amount > 0) {
                principalPaid = amount;
                MarketStorageLib.marketStore().loans[loanID].principalOwed =
                    MarketStorageLib.marketStore().loans[loanID].principalOwed -
                    (amount);
            }
        }

        LibLendingPool.repay(loanID, principalPaid, interestPaid, msg.sender);

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            MarketStorageLib.marketStore().loans[loanID].status = LoanStatus
                .Closed;
            LibCollateral._withdrawCollateral(
                loanID,
                MarketStorageLib.marketStore().loans[loanID].collateral,
                MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower
            );
        }

        emit LoanRepaid(
            loanID,
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            principalPaid + interestPaid,
            msg.sender,
            totalOwed
        );
    }

    /**
        @notice It transfers an amount of tokens from an address to this contract.
        @param from address where the tokens will transfer from.
        @param amount to be transferred.
        @param lendingToken the address of the lending token
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(
        address from,
        uint256 amount,
        address lendingToken
    ) private returns (uint256 balanceIncrease) {
        uint256 balanceBefore = IERC20(lendingToken).balanceOf(address(this));
        SafeERC20.safeTransferFrom(
            IERC20(lendingToken),
            from,
            address(this),
            amount
        );
        return IERC20(lendingToken).balanceOf(address(this)) - (balanceBefore);
    }
}
