// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../internal/loans-consts.sol";
import "../../../../contracts/providers/openzeppelin/Roles.sol";
import "../storage/loans.sol";
import "../../../contexts/access-control/storage.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../internal/loans.sol";

abstract contract ent_Loans_v1 is
    LoansConsts,
    Roles,
    sto_AccessControl_v1,
    mod_authorized_AccessControl_v1,
    sto_Loans_v1,
    ILoanManager,
    int_Loans_v1
{
    using SafeMath for uint256;
    using SafeERC20 for ERC20;
    using NumbersLib for uint256;
    using NumbersLib for int256;
    using AddressLib for address;

    function createLoanWithTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        override
        whenNotPaused
        withValidLoanRequest(request)
        authorized(PAUSER, msg.sender)
    {
        require(msg.sender == request.borrower, "NOT_LOAN_REQUESTER");

        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            processLoanTerms(request, responses);

        uint256 loanID =
            _createNewLoan(
                request,
                interestRate,
                collateralRatio,
                maxLoanAmount
            );

        if (collateralAmount > 0) {
            _payInCollateral(loanID, collateralAmount);
        }

        if (request.recipient.isNotEmpty()) {
            require(canGoToEOA(loanID), "UNDER_COLL_WITH_RECIPIENT");
        }

        borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            msg.sender,
            s().loans[loanID].loanTerms.recipient,
            request.requestNonce
        );
    }

    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        override
        loanActiveOrSet(loanID)
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        authorized(PAUSER, msg.sender)
    {
        require(
            msg.sender == s().loans[loanID].loanTerms.borrower,
            "CALLER_DOESNT_OWN_LOAN"
        );
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");

        if (loans[loanID].status == TellerCommon.LoanStatus.Active) {
            (, int256 neededInCollateralTokens, ) =
                getCollateralNeededInfo(loanID);
            if (neededInCollateralTokens > 0) {
                // Withdrawal amount holds the amount of excess collateral in the loan
                uint256 withdrawalAmount =
                    s().loans[loanID].collateral.sub(
                        uint256(neededInCollateralTokens)
                    );
                require(
                    withdrawalAmount >= amount,
                    "COLLATERAL_AMOUNT_TOO_HIGH"
                );
            }
        } else {
            require(
                s().loans[loanID].collateral >= amount,
                "COLLATERAL_AMOUNT_NOT_MATCH"
            );
        }

        _withdrawCollateral(loanID, amount, payable(msg.sender));
    }

    function depositCollateral(
        address borrower,
        uint256 loanID,
        uint256 amount
    )
        external
        payable
        override
        loanActiveOrSet(loanID)
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        onlyAuthorized
    {
        borrower.requireEqualTo(
            s().loans[loanID].loanTerms.borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );
        require(amount > 0, "CANNOT_DEPOSIT_ZERO");

        // Update the loan collateral and total. Transfer tokens to this contract.
        _payInCollateral(loanID, amount);
    }

    function takeOutLoan(uint256 loanID, uint256 amountBorrow)
        external
        override
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        authorized(PAUSER, msg.sender)
    {
        require(
            msg.sender == s().loans[loanID].loanTerms.borrower,
            "NOT_BORROWER"
        );
        require(
            s().loans[loanID].status == TellerCommon.LoanStatus.TermsSet,
            "LOAN_NOT_SET"
        );
        require(
            s().loans[loanID].termsExpiry >= block.timestamp,
            "LOAN_TERMS_EXPIRED"
        );
        require(_isDebtRatioValid(amountBorrow), "SUPPLY_TO_DEBT_EXCEEDS_MAX");
        require(
            s().loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );
        // check that enough collateral has been provided for this loan
        (, int256 neededInCollateral, ) = getCollateralNeededInfo(loanID);
        require(
            neededInCollateral <= int256(s().loans[loanID].collateral),
            "MORE_COLLATERAL_REQUIRED"
        );
        require(
            s().loans[loanID].lastCollateralIn <=
                block.timestamp.sub(settings.getSafetyIntervalValue()),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        s().loans[loanID].borrowedAmount = amountBorrow;
        s().loans[loanID].principalOwed = amountBorrow;
        s().loans[loanID].interestOwed = getInterestOwedFor(
            loanID,
            amountBorrow
        );
        s().loans[loanID].status = TellerCommon.LoanStatus.Active;
        s().loans[loanID].loanStartTime = block.timestamp;

        address loanRecipient;
        bool eoaAllowed = canGoToEOA(loanID);
        if (eoaAllowed) {
            loanRecipient = s().loans[loanID].loanTerms.recipient.isEmpty()
                ? s().loans[loanID].loanTerms.borrower
                : s().loans[loanID].loanTerms.recipient;
        } else {
            s().loans[loanID].escrow = _createEscrow(loanID);
            loanRecipient = s().loans[loanID].escrow;
        }

        s().lendingPool.createLoan(amountBorrow, loanRecipient);

        if (!eoaAllowed) {
            s().loans[loanID].escrow.requireNotEmpty(
                "ESCROW_CONTRACT_NOT_DEFINED"
            );
            IEscrow(s().loans[loanID].escrow).initialize(
                address(settings),
                address(lendingPool),
                loanID,
                s().lendingToken,
                s().loans[loanID].loanTerms.borrower
            );
        }

        emit LoanTakenOut(
            loanID,
            s().loans[loanID].loanTerms.borrower,
            s().loans[loanID].escrow,
            amountBorrow
        );
    }

    function repay(uint256 amount, uint256 loanID)
        external
        override
        loanActive(loanID)
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        authorized(PAUSER, msg.sender)
    {
        require(amount > 0, "AMOUNT_VALUE_REQUIRED");
        uint256 totalOwed = getTotalOwed(loanID);
        if (totalOwed < amount) {
            amount = totalOwed;
        }
        totalOwed = totalOwed.sub(amount);

        uint256 principalPaid;
        uint256 interestPaid;
        if (amount < s().loans[loanID].interestOwed) {
            interestPaid = amount;
            s().loans[loanID].interestOwed = s().loans[loanID].interestOwed.sub(
                amount
            );
        } else {
            if (s().loans[loanID].interestOwed > 0) {
                interestPaid = s().loans[loanID].interestOwed;
                amount = amount.sub(interestPaid);
                s().loans[loanID].interestOwed = 0;
            }

            if (amount > 0) {
                principalPaid = amount;
                s().loans[loanID].principalOwed = s().loans[loanID]
                    .principalOwed
                    .sub(amount);
            }
        }

        // collect the money from the payer
        s().lendingPool.repay(principalPaid, interestPaid, msg.sender);

        // if the loan is now fully paid, close it and return collateral
        if (totalOwed == 0) {
            s().loans[loanID].status = TellerCommon.LoanStatus.Closed;
            _withdrawCollateral(
                loanID,
                s().loans[loanID].collateral,
                s().loans[loanID].loanTerms.borrower
            );
        }

        emit LoanRepaid(
            loanID,
            s().loans[loanID].loanTerms.borrower,
            principalPaid.add(interestPaid),
            msg.sender,
            totalOwed
        );
    }

    function liquidateLoan(uint256 loanID)
        external
        override
        loanActive(loanID)
        whenNotPaused
        whenLendingPoolNotPaused(address(lendingPool))
        authorized(PAUSER, msg.sender)
    {
        require(isLiquidable(loanID), "DOESNT_NEED_LIQUIDATION");

        int256 rewardInCollateral = getLiquidationReward(loanID);

        // the liquidator pays the amount still owed on the loan
        uint256 amountToLiquidate =
            s().loans[loanID].principalOwed.add(loans[loanID].interestOwed);
        s().lendingPool.repay(
            s().loans[loanID].principalOwed,
            s().loans[loanID].interestOwed,
            msg.sender
        );

        s().loans[loanID].status = TellerCommon.LoanStatus.Closed;
        s().loans[loanID].liquidated = true;

        _payOutLiquidator(loanID, rewardInCollateral, payable(msg.sender));

        emit LoanLiquidated(
            loanID,
            s().loans[loanID].loanTerms.borrower,
            msg.sender,
            rewardInCollateral,
            amountToLiquidate
        );
    }
}
