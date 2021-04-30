// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";
import { LoanDataFacet } from "./LoanDataFacet.sol";

// Libraries
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { LibDapps } from "../escrow/dapps/libraries/LibDapps.sol";
import { LibEscrow } from "../escrow/libraries/LibEscrow.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/libraries/PlatformSettingsLib.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";
import { PriceAggLib } from "../price-aggregator/PriceAggLib.sol";
import { NFTLib } from "../nft/libraries/NFTLib.sol";

// Interfaces
import { ITToken } from "../lending/ttoken/ITToken.sol";
import { ILoansEscrow } from "../escrow/escrow/ILoansEscrow.sol";

// Storage
import {
    MarketStorageLib,
    MarketStorage,
    Loan,
    LoanStatus
} from "../storage/market.sol";

contract RepayFacet is RolesMods, ReentryMods, PausableMods {
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
     * @param reward Value in lending token paid out to liquidator
     * @param tokensIn Percentage of the collateral price paid by the liquidator to the lending pool
     */
    event LoanLiquidated(
        uint256 indexed loanID,
        address indexed borrower,
        address liquidator,
        uint256 reward,
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
        uint256 balance =
            LibEscrow.balanceOf(loanID, LibLoans.loan(loanID).lendingToken);
        uint256 totalOwed = LibLoans.getTotalOwed(loanID);
        if (balance < totalOwed && amount > balance) {
            uint256 amountNeeded =
                amount > totalOwed ? totalOwed - (balance) : amount - (balance);

            SafeERC20.safeTransferFrom(
                IERC20(LibLoans.loan(loanID).lendingToken),
                msg.sender,
                address(LibEscrow.e(loanID)),
                amountNeeded
            );
        }

        Loan storage loan = LibLoans.loan(loanID);
        uint256 leftToPay =
            __repayLoan(loan, amount, address(LibEscrow.e(loanID)));
        // if the loan is now fully paid, close it and withdraw borrower collateral
        if (leftToPay == 0) {
            loan.status = LoanStatus.Closed;
            LibCollateral.withdrawAll(loan.id, loan.loanTerms.borrower);
        }

        emit LoanRepaid(
            loan.id,
            loan.loanTerms.borrower,
            amount,
            msg.sender,
            leftToPay
        );
    }

    /**
     * @notice Make a payment to a loan
     * @param loanID The ID of the loan the payment is for
     * @param amount The amount of tokens to pay back to the loan
     */
    function repayLoan(uint256 loanID, uint256 amount)
        external
        nonReentry("")
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        Loan storage loan = LibLoans.loan(loanID);
        uint256 leftToPay = __repayLoan(loan, amount, msg.sender);
        // if the loan is now fully paid, close it and withdraw borrower collateral
        if (leftToPay == 0) {
            loan.status = LoanStatus.Closed;
            LibCollateral.withdrawAll(loan.id, loan.loanTerms.borrower);
            NFTLib.unlinkFromLoan(loan.id);
        }

        emit LoanRepaid(
            loan.id,
            loan.loanTerms.borrower,
            amount,
            msg.sender,
            leftToPay
        );
    }

    function __repayLoan(
        Loan storage loan,
        uint256 amount,
        address sender
    ) private returns (uint256 leftToPay_) {
        require(amount > 0, "Teller: zero repay");

        // calculate the actual amount to repay
        leftToPay_ = loan.principalOwed + loan.interestOwed;
        if (leftToPay_ < amount) {
            amount = leftToPay_;
            leftToPay_ = 0;
        } else {
            leftToPay_ -= amount;
        }

        // Get the Teller token for the loan
        ITToken tToken = MarketStorageLib.store().tTokens[loan.lendingToken];
        // Transfer funds from account
        if (address(LibEscrow.e(loan.id)) == sender) {
            LibEscrow.e(loan.id).claimToken(
                loan.lendingToken,
                address(tToken),
                amount
            );
        } else {
            SafeERC20.safeTransferFrom(
                IERC20(loan.lendingToken),
                sender,
                address(tToken),
                amount
            );
        }
        // Tell the Teller token we sent funds and to execute the deposit strategy
        tToken.depositStrategy();

        // Deduct the interest and principal owed
        uint256 principalPaid;
        uint256 interestPaid;
        if (amount < loan.interestOwed) {
            interestPaid = amount;
            loan.interestOwed -= amount;
        } else {
            if (loan.interestOwed > 0) {
                interestPaid = loan.interestOwed;
                amount -= interestPaid;
                loan.interestOwed = 0;
            }

            if (amount > 0) {
                principalPaid = amount;
                loan.principalOwed -= amount;
            }
        }

        MarketStorageLib.store().totalRepaid[
            loan.lendingToken
        ] += principalPaid;
        MarketStorageLib.store().totalInterestRepaid[
            loan.lendingToken
        ] += interestPaid;
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
        Loan storage loan = LibLoans.loan(loanID);
        uint256 collateralAmount = LibCollateral.e(loan.id).loanSupply(loan.id);
        require(
            RepayLib.isLiquidable(loan, collateralAmount),
            "Teller: does not need liquidation"
        );

        // Calculate the reward before repaying the loan
        (uint256 rewardInLending, uint256 collateralInLending) =
            RepayLib.getLiquidationReward(loanID, collateralAmount);

        // The liquidator pays the amount still owed on the loan
        uint256 amountToLiquidate = loan.principalOwed + loan.interestOwed;
        // Make sure there is nothing left to repay on the loan
        require(
            __repayLoan(loan, amountToLiquidate, msg.sender) == 0,
            "Teller: liquidate partial repay"
        );

        // Set loan status
        loan.status = LoanStatus.Liquidated;

        // Payout the liquidator reward owed
        if (rewardInLending > 0) {
            RepayLib.payOutLiquidator(
                loan,
                rewardInLending,
                collateralInLending,
                collateralAmount,
                payable(msg.sender)
            );
        }

        // Transfer NFT if linked
        NFTLib.liquidateNFT(loanID);

        emit LoanLiquidated(
            loanID,
            loan.loanTerms.borrower,
            msg.sender,
            rewardInLending,
            amountToLiquidate
        );
    }

    /**
     * @notice It gets the current liquidation reward for a given loan.
     * @param loanID The loan ID to get the info.
     * @return inLending_ The value the liquidator will receive denoted in lending tokens.
     * @return inCollateral_ The value the liquidator will receive denoted in collateral tokens.
     */
    function getLiquidationReward(uint256 loanID)
        external
        view
        returns (uint256 inLending_, uint256 inCollateral_)
    {
        (inLending_, ) = RepayLib.getLiquidationReward(
            loanID,
            LibCollateral.e(loanID).loanSupply(loanID)
        );
        inCollateral_ = PriceAggLib.valueFor(
            LibLoans.loan(loanID).lendingToken,
            LibLoans.loan(loanID).collateralToken,
            inLending_
        );
    }
}

library RepayLib {
    /**
     * @notice It checks if a loan can be liquidated.
     * @param loan The loan storage pointer to check.
     * @return true if the loan is liquidable.
     */
    function isLiquidable(Loan storage loan, uint256 collateralAmount)
        internal
        view
        returns (bool)
    {
        // Check if loan can be liquidated
        if (loan.status != LoanStatus.Active) {
            return false;
        }

        if (loan.loanTerms.collateralRatio > 0) {
            // If loan has a collateral ratio, check how much is needed
            (, uint256 neededInCollateral, ) =
                LoanDataFacet(address(this)).getCollateralNeededInfo(loan.id);
            if (neededInCollateral > collateralAmount) {
                return true;
            }
        }

        // Otherwise, check if the loan has expired
        return block.timestamp >= loan.loanStartTime + loan.loanTerms.duration;
    }

    /**
     * @notice It gets the current liquidation reward for a given loan.
     * @param loanID The loan ID to get the info.
     * @param collateralAmount The amount of collateral for the {loanID}. Passed in to save gas calling the collateral escrow multiple times.
     * @return reward_ The value the liquidator will receive denoted in lending tokens.
     */
    function getLiquidationReward(uint256 loanID, uint256 collateralAmount)
        internal
        view
        returns (uint256 reward_, uint256 collateralValue_)
    {
        uint256 amountToLiquidate =
            LibLoans.loan(loanID).principalOwed +
                LibLoans.loan(loanID).interestOwed;

        // Max reward is amount repaid on loan plus extra percentage
        uint256 maxReward =
            amountToLiquidate +
                NumbersLib.percent(
                    amountToLiquidate,
                    PlatformSettingsLib.getLiquidateRewardPercent()
                );

        // Calculate available collateral for reward
        if (collateralAmount > 0) {
            collateralValue_ = PriceAggLib.valueFor(
                LibLoans.loan(loanID).collateralToken,
                LibLoans.loan(loanID).lendingToken,
                collateralAmount
            );
            reward_ += collateralValue_;
        }

        // Calculate loan escrow value if collateral not enough to cover reward
        if (reward_ < maxReward) {
            reward_ += LibEscrow.calculateTotalValue(loanID);
        }

        // Cap the reward to max
        if (reward_ > maxReward) {
            reward_ = maxReward;
        }
    }

    /**
     * @notice Checks if the loan has an Escrow and claims any tokens then pays out the loan collateral.
     * @dev See Escrow.claimTokens for more info.
     * @param loan The loan storage pointer which is being liquidated
     * @param rewardInLending The total amount of reward based in the lending token to pay the liquidator
     * @param collateralInLending The amount of collateral that is available for the loan denoted in lending tokens
     * @param collateralAmount The amount of collateral that is available for the loan
     * @param liquidator The address of the liquidator where the liquidation reward will be sent to
     */
    function payOutLiquidator(
        Loan storage loan,
        uint256 rewardInLending,
        uint256 collateralInLending,
        uint256 collateralAmount,
        address payable liquidator
    ) internal {
        require(
            loan.status == LoanStatus.Liquidated,
            "Teller: loan not liquidated"
        );

        if (rewardInLending <= collateralInLending) {
            uint256 rewardInCollateral =
                PriceAggLib.valueFor(
                    LibLoans.loan(loan.id).lendingToken,
                    LibLoans.loan(loan.id).collateralToken,
                    rewardInLending
                );

            LibCollateral.withdraw(loan.id, rewardInCollateral, liquidator);
        } else {
            // Payout whats available in the collateral token
            LibCollateral.withdraw(loan.id, collateralAmount, liquidator);

            // Claim remaining reward value from the loan escrow
            claimEscrowTokensByValue(
                loan,
                liquidator,
                rewardInLending - collateralInLending
            );
        }
    }

    /**
     * @dev Send the equivalent of tokens owned by the loan escrow (in lending value) to the recipient,
     * @param recipient address to send the tokens to
     * @param value The value of escrow held tokens to be claimed based in lending value
     */
    function claimEscrowTokensByValue(
        Loan storage loan,
        address recipient,
        uint256 value
    ) private {
        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loan.id];
        uint256 valueLeftToTransfer = value;
        // cycle through tokens
        for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
            if (valueLeftToTransfer == 0) {
                return;
            }

            uint256 balance =
                LibEscrow.balanceOf(loan.id, EnumerableSet.at(tokens, i));
            // get value of token balance in lending value
            if (balance > 0) {
                // If token not the lending token, get value of token
                uint256 balanceInLending;
                if (EnumerableSet.at(tokens, i) == loan.lendingToken) {
                    balanceInLending = balance;
                } else {
                    balanceInLending = PriceAggLib.valueFor(
                        EnumerableSet.at(tokens, i),
                        loan.lendingToken,
                        balance
                    );
                }

                if (balanceInLending <= valueLeftToTransfer) {
                    LibEscrow.e(loan.id).claimToken(
                        EnumerableSet.at(tokens, i),
                        recipient,
                        balance
                    );
                    valueLeftToTransfer -= balanceInLending;
                } else {
                    // Token balance is more than enough so calculate ratio of balance to transfer
                    uint256 valueToTransfer;
                    if (EnumerableSet.at(tokens, i) == loan.lendingToken) {
                        valueToTransfer = valueLeftToTransfer;
                    } else {
                        valueToTransfer = NumbersLib.percent(
                            balanceInLending,
                            NumbersLib.ratioOf(
                                valueLeftToTransfer,
                                balanceInLending
                            )
                        );
                    }

                    LibEscrow.e(loan.id).claimToken(
                        EnumerableSet.at(tokens, i),
                        recipient,
                        valueToTransfer
                    );
                    valueLeftToTransfer = 0;
                }
            }
        }
    }
}
