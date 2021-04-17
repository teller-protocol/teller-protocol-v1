// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { LibDapps } from "../dapps/libraries/LibDapps.sol";

// Interfaces
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Storage
import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus
} from "../storage/market.sol";

contract RepayFacet is RolesMods, ReentryMods, PausableMods {
    using SafeERC20 for IERC20;
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
     * @notice Repay this Escrow's loan.
     * @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
     * @dev Only the owner of the Escrow can call this. If someone else wants to make a payment, they should call the loan manager directly.
     * @param loanID The id of the loan being used.
     * @param amount The amount being repaid.
     */
    function escrowRepay(uint256 loanID, uint256 amount)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry("")
    {
        address lendingToken =
            MarketStorageLib.store().loans[loanID].lendingToken;
        IERC20 token = IERC20(lendingToken);
        uint256 balance = LibDapps.balanceOf(loanID, address(token));
        uint256 totalOwed = LibLoans.getTotalOwed(loanID);
        if (balance < totalOwed && amount > balance) {
            uint256 amountNeeded =
                amount > totalOwed ? totalOwed - (balance) : amount - (balance);

            token.safeTransferFrom(msg.sender, address(this), amountNeeded);
        }

        token.safeApprove(address(this), amount);
        //        TODO merge with 'contarcts/market/RepayFacet'
        repay(amount, loanID);
    }

    /**
     * @notice Make a payment to a loan
     * @param amount The amount of tokens to pay back to the loan
     * @param loanID The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID)
        public
        nonReentry("")
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

        MarketStorage storage s = MarketStorageLib.store();

        // Deduct the interest and principal owed
        uint256 principalPaid;
        uint256 interestPaid;
        if (amount < s.loans[loanID].interestOwed) {
            interestPaid = amount;
            s.loans[loanID].interestOwed -= amount;
        } else {
            if (s.loans[loanID].interestOwed > 0) {
                interestPaid = s.loans[loanID].interestOwed;
                amount = amount - interestPaid;
                s.loans[loanID].interestOwed = 0;
            }

            if (amount > 0) {
                principalPaid = amount;
                s.loans[loanID].principalOwed -= amount;
            }
        }

        s.totalRepaid[s.loans[loanID].lendingToken] += principalPaid;
        s.totalInterestRepaid[s.loans[loanID].lendingToken] += interestPaid;

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            s.loans[loanID].status = LoanStatus.Closed;
            LibCollateral.withdrawCollateral(
                loanID,
                s.loans[loanID].collateral,
                s.loans[loanID].loanTerms.borrower
            );
        }

        emit LoanRepaid(
            loanID,
            s.loans[loanID].loanTerms.borrower,
            principalPaid + interestPaid,
            msg.sender,
            totalOwed
        );
    }

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
        require(
            LibLoans.isLiquidable(loanID),
            "Teller: does not need liquidation"
        );

        int256 rewardInCollateral = LibLoans.getLiquidationReward(loanID);

        // the liquidator pays the amount still owed on the loan
        uint256 amountToLiquidate =
            MarketStorageLib.store().loans[loanID].principalOwed +
                (MarketStorageLib.store().loans[loanID].interestOwed);

        //        TODO merge with 'contracts/market/RepayFacet
        _repayLoan(
            loanID,
            MarketStorageLib.store().loans[loanID].principalOwed,
            MarketStorageLib.store().loans[loanID].interestOwed,
            msg.sender
        );

        MarketStorageLib.store().loans[loanID].status = LoanStatus.Liquidated;

        // the caller gets the collateral from the loan
        LibCollateral.payOutLiquidator(
            loanID,
            rewardInCollateral,
            payable(msg.sender)
        );

        emit LoanLiquidated(
            loanID,
            MarketStorageLib.store().loans[loanID].loanTerms.borrower,
            msg.sender,
            uint256(rewardInCollateral),
            amountToLiquidate
        );
    }

    /**
     * @notice It allows a borrower to repay their loan or a liquidator to liquidate a loan.
     * @dev It requires a ERC20.approve call before calling it. (Does it though with diamonds?)
     * @dev It throws a require error if borrower called ERC20.approve function before calling it.
     * @param loanID The id of the loan being repaid or liquidated.
     * @param principalAmount amount of tokens towards the principal.
     * @param interestAmount amount of tokens towards the interest.
     * @param sender address that is repaying the loan.
     */
    function _repayLoan(
        uint256 loanID,
        uint256 principalAmount,
        uint256 interestAmount,
        address sender
    ) internal {
        uint256 totalAmount = principalAmount + interestAmount;
        require(totalAmount > 0, "REPAY_ZERO");

        address asset = MarketStorageLib.store().loans[loanID].lendingToken;
        // Transfers tokens to LendingPool.
        tokenTransferFrom(sender, totalAmount, asset);

        MarketStorageLib.store().totalRepaid[asset] += principalAmount;
        MarketStorageLib.store().totalInterestRepaid[asset] += interestAmount;
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
