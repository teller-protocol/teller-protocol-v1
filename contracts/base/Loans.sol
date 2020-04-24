/*
    Copyright 2020 Fabrx Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../interfaces/LoansInterface.sol";
import "../interfaces/PairAggregatorInterface.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";
import "../util/ZeroCollateralCommon.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";


contract Loans is LoansInterface {
    using SafeMath for uint256;

    uint256 private constant ONE_HOUR = 3600;
    uint256 private constant ONE_DAY = 3600 * 24;
    uint256 private constant LIQUIDATE_ETH_PRICE = 95; // Eth is bought at 95% of the going rate
    uint256 private constant ONE_HUNDRED = 100; // Used when finding a percentage of a number - divide by 100
    uint256 private constant DAYS_PER_YEAR = 365;
    uint256 private constant TEN_THOUSAND = 10000; // For interest and collateral, 7% is represented as 700.
    // to find the value of something we must divide 700 by 100 to remove decimal places, and another 100 for percentage

    uint256 public totalCollateral;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    uint256 public timeWindowToTakeOutLoan = 7 days;

    PairAggregatorInterface public priceOracle;

    LendingPoolInterface public lendingPool;

    LoanTermsConsensusInterface public loanTermsConsensus;

    mapping(address => uint256[]) private borrowerLoans;

    mapping(uint256 => ZeroCollateralCommon.RequestedLoan) public requestedLoans;

    mapping(uint256 => ZeroCollateralCommon.Loan) public loans;

    /** Modifiers */

    modifier loanIDValid(uint256 loanID) {
        require(loanID < loanIDCounter, "LOAN_ID_INVALID");
        _;
    }

    modifier isConsensus() {
        require(msg.sender == address(loanTermsConsensus), "SENDER_NOT_ALLOWED");
        _;
    }

    constructor(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        uint256 aTimeWindowToTakeOutLoan
    ) public {
        require(priceOracleAddress != address(0), "PROVIDE_ORACLE_ADDRESS");
        require(lendingPoolAddress != address(0), "PROVIDE_LENDINGPOOL_ADDRESS");
        require(
            loanTermsConsensusAddress != address(0),
            "PROVIDE_REQUESTEDLOANCONSENSUS_ADDRESS"
        );
        require(aTimeWindowToTakeOutLoan > 0, "PROVIDE_TIMEWINDOW_TAKEOUT_LOAN");

        priceOracle = PairAggregatorInterface(priceOracleAddress);
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        loanTermsConsensus = LoanTermsConsensusInterface(loanTermsConsensusAddress);
        timeWindowToTakeOutLoan = aTimeWindowToTakeOutLoan * 1 days;
    }

    /**
     * @notice Deposit collateral into a loan
     * @param borrower address The address of the loan borrower.
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function depositCollateral(address borrower, uint256 loanID)
        external
        payable
        loanIDValid(loanID)
    {
        require(loans[loanID].borrower == borrower, "BORROWER_LOAN_ID_MISMATCH");
        require(loans[loanID].active, "LOAN_NOT_ACTIVE");

        uint256 depositAmount = msg.value;

        // update the contract total and the loan collateral total
        payInCollateral(loanID, depositAmount);

        emit CollateralDeposited(loanID, borrower, depositAmount);
    }

    /**
     * @notice Withdraw collateral from a loan, unless this isn't allowed
     * @param amount uint256 The amount of ETH the caller is hoping to withdraw
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        loanIDValid(loanID)
    {
        require(msg.sender == loans[loanID].borrower, "CALLER_DOESNT_OWN_LOAN");

        // Find the minimum collateral amount this loan is allowed in tokens
        uint256 minimumCollateralDAI = getMinimumAllowedCollateralDAI(loanID);

        require(
            priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR),
            "ORACLE_PRICE_OLD"
        );

        uint256 ethPrice = uint256(priceOracle.getLatestAnswer());
        uint256 minimumCollateralETH = minimumCollateralDAI.div(ethPrice);

        // Withdrawal amount holds the amoutn of excess collateral in the loan
        uint256 withdrawalAmount = loans[loanID].collateral.sub(minimumCollateralETH);
        if (withdrawalAmount > amount) {
            withdrawalAmount = amount;
        }

        if (withdrawalAmount > 0) {
            // Update the contract total and the loan collateral total
            payOutCollateral(loanID, withdrawalAmount, msg.sender);
        }

        emit CollateralWithdrawn(loanID, msg.sender, withdrawalAmount);
    }

    function requestLoan(uint256 amount, uint16 numberOfDays) external {
        address payable borrower = msg.sender;
        ZeroCollateralCommon.RequestedLoan memory lastRequestedLoan = getRequestedLoan(
            borrower
        );
        require(
            lastRequestedLoan.status >=
                ZeroCollateralCommon.RequestedLoanStatus.Processed,
            "ALREADY_HAS_A_REQUESTED_LOAN"
        );

        uint256 requestedLoanId = loanIDCounter;
        loanIDCounter += 1;

        createRequestedLoan(requestedLoanId, borrower, amount, numberOfDays);

        emit LoanRequested(requestedLoanId, borrower, amount, numberOfDays);
    }

    function setLoanTerms(
        address borrower,
        uint256 requestedLoanId,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) external isConsensus() {
        require(
            requestedLoans[requestedLoanId].status ==
                ZeroCollateralCommon.RequestedLoanStatus.Processing,
            "CURRENT_STATUS_NOT_PROCESSING"
        );
        require(
            requestedLoans[requestedLoanId].borrower == borrower,
            "BORROWER_NOT_LOAN_OWNER"
        );

        // Update Loan Terms
        requestedLoans[requestedLoanId].interestRate = interestRate;
        requestedLoans[requestedLoanId].collateralRatio = collateralRatio;
        requestedLoans[requestedLoanId].maxLoanAmount = maxLoanAmount;
        requestedLoans[requestedLoanId].status = ZeroCollateralCommon
            .RequestedLoanStatus
            .Processed;
        requestedLoans[requestedLoanId].processedAt = now;

        // Emit event
        emit LoanTermsUpdated(
            requestedLoanId,
            borrower,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );
    }

    /**
     * @notice Take out a pre-requested loan.
     */
    function takeOutLoan() external payable returns (uint256) {
        address payable borrower = msg.sender;
        ZeroCollateralCommon.RequestedLoan memory requestedLoan = getRequestedLoan(
            borrower
        );

        require(
            requestedLoan.status == ZeroCollateralCommon.RequestedLoanStatus.Processed,
            "REQUESTED_LOAN_NOT_PROCESSED"
        );
        require(
            requestedLoan.processedAt >= now.sub(timeWindowToTakeOutLoan),
            "TIME_WINDOW_FINISHED"
        );

        // Check that Oracle price (Ether) is updated.
        require(isOraclePriceUpdated(), "ORACLE_PRICE_OLD");

        // Check that enough collateral has been provided for this loan
        require(
            isCollateralSentEnough(requestedLoan.amount, requestedLoan.collateralRatio),
            "MORE_COLLATERAL_REQUIRED"
        );

        // Create the loan
        createNewLoan(msg.value, requestedLoan);

        // Add loan ID to the borrower's list of loans
        borrowerLoans[borrower].push(requestedLoan.id);

        // Give the borrower their requested amount of tokens
        lendingPool.createLoan(requestedLoan.amount, borrower);

        totalCollateral = totalCollateral.add(msg.value);

        emit LoanCreated(
            requestedLoan.id,
            borrower,
            requestedLoan.interestRate,
            requestedLoan.collateralRatio,
            requestedLoan.maxLoanAmount,
            requestedLoan.numberOfDays
        );

        return requestedLoan.id;
    }

    /**
     * @notice Make a payment to a loan
     * @param amount uint256 The amount of tokens to pay back to the loan
     * @param loanID uint256 The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID) external loanIDValid(loanID) {
        require(loans[loanID].active, "LOAN_NOT_ACTIVE");

        // calculate the actual amount to repay
        uint256 toPay = amount;
        if (loans[loanID].totalOwed < toPay) {
            toPay = loans[loanID].totalOwed;
        }

        if (toPay > 0) {
            // update the loan
            loans[loanID].totalOwed = loans[loanID].totalOwed.sub(toPay);
            if (loans[loanID].totalOwed == 0) {
                loans[loanID].active = false;

                payOutCollateral(
                    loanID,
                    loans[loanID].collateral,
                    loans[loanID].borrower
                );
            }

            lendingPool.repay(toPay, msg.sender);
        }
    }

    /**
     * @notice Liquidate a loan if it is expired or undercollateralised
     * @param loanID uint256 The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID) external loanIDValid(loanID) {
        require(loans[loanID].active, "LOAN_NOT_ACTIVE");

        // check that enough collateral has been provided for this loan
        require(
            priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR),
            "ORACLE_PRICE_OLD"
        );

        uint256 ethPrice = uint256(priceOracle.getLatestAnswer());
        uint256 collateralInDAI = loans[loanID].collateral.mul(ethPrice);
        uint256 minCollateralDAI = getMinimumAllowedCollateralDAI(loanID);
        // TODO - CHECK DECIMALS ON ETH PRICE

        // must be under collateralised or expired
        require(
            minCollateralDAI > collateralInDAI || loans[loanID].timeEnd < now,
            "DOESNT_NEED_LIQUIDATION"
        );

        loans[loanID].active = false;

        // the msg.sender pays tokens at 95% of collateral price
        lendingPool.liquidationPayment(
            collateralInDAI.mul(LIQUIDATE_ETH_PRICE).div(ONE_HUNDRED),
            msg.sender
        );

        // and gets sent the ETH collateral in return
        payOutCollateral(loanID, loans[loanID].collateral, msg.sender);
    }

    /**
     * @notice Get a list of all loans for a borrower
     * @param borrower address The borrower's address
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    function getMinimumAllowedCollateralDAI(uint256 loanID)
        internal
        view
        returns (uint256)
    {
        uint256 loanAmount = loans[loanID].totalOwed;
        uint256 collateralRatio = loans[loanID].collateralRatio;

        return loanAmount.mul(collateralRatio).div(TEN_THOUSAND);
    }

    function getRequestedLoan(address borrower)
        internal
        view
        returns (ZeroCollateralCommon.RequestedLoan memory)
    {
        uint256[] memory requestedLoansList = borrowerLoans[borrower];
        uint256 lastRequestedLoanIndex = requestedLoansList.length == 0
            ? 0
            : requestedLoansList.length - 1;
        return requestedLoans[lastRequestedLoanIndex];
    }

    function createRequestedLoan(
        uint256 requestedLoanId,
        address payable borrower,
        uint256 amount,
        uint256 numberOfDays
    ) internal {
        requestedLoans[requestedLoanId] = ZeroCollateralCommon.RequestedLoan({
            borrower: // Requested Loan Data
            borrower,
            id: requestedLoanId,
            amount: amount,
            numberOfDays: numberOfDays,
            maxLoanAmount: // Loan Terms
            0,
            interestRate: 0,
            collateralRatio: 0,
            processedAt: // Requested Loan Status
            0,
            status: ZeroCollateralCommon.RequestedLoanStatus.Processing
        });
    }

    function isOraclePriceUpdated() internal view returns (bool) {
        return priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR);
    }

    function payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal
    {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);
        recipient.transfer(amount);
    }

    function payInCollateral(uint256 loanID, uint256 amount) internal {
        totalCollateral = totalCollateral.add(amount);
        loans[loanID].collateral = loans[loanID].collateral.add(amount);
    }

    // This function must be separated out to avoid a stack overflow
    function createNewLoan(
        uint256 collateral,
        ZeroCollateralCommon.RequestedLoan memory requestedLoan
    ) internal {
        uint256 totalOwed = requestedLoan.amount.add(
            requestedLoan
                .amount
                .mul(requestedLoan.interestRate)
                .mul(requestedLoan.numberOfDays)
                .div(TEN_THOUSAND)
                .div(DAYS_PER_YEAR)
        );
        loans[requestedLoan.id] = ZeroCollateralCommon.Loan({
            id: requestedLoan.id,
            collateral: collateral,
            interestRate: requestedLoan.interestRate,
            collateralRatio: requestedLoan.collateralRatio,
            maxLoanAmount: requestedLoan.maxLoanAmount,
            totalOwed: totalOwed,
            timeStart: now,
            timeEnd: now.add(requestedLoan.numberOfDays.mul(ONE_DAY)),
            borrower: requestedLoan.borrower,
            active: true,
            liquidated: false
        });
    }

    function isCollateralSentEnough(uint256 amountToBorrow, uint256 collateralRatio)
        internal
        view
        returns (bool)
    {
        // TODO - CHECK DECIMALS ON ETH PRICE (LOOKS LIKE IT CONTAINS 8 DECIMALS)
        uint256 oneEtherPrice = uint256(priceOracle.getLatestAnswer());
        uint256 collateralSent = msg.value.mul(oneEtherPrice);
        uint256 collateralNeeded = amountToBorrow.mul(collateralRatio).div(TEN_THOUSAND);
        return collateralSent >= collateralNeeded;
    }
}
