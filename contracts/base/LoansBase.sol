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

// Libraries and common
import "../util/ZeroCollateralCommon.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Contracts
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";
import "../base/Base.sol";

// Interfaces
import "../interfaces/PairAggregatorInterface.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";


contract LoansBase is Base {
    using SafeMath for uint256;

    uint256 internal constant TEN = 10; // Used to calculate one whole token.
    // Loan length will be inputted in days, with 4 decimal places. i.e. 30 days will be inputted as
    // 300000. Therefore in interest calculations we must divide by 365000
    uint256 internal constant DAYS_PER_YEAR_4DP = 3650000;
    // For interestRate, collateral, and liquidation price, 7% is represented as 700. To find the value
    // of something we must divide 700 by 100 to remove decimal places, and another 100 for percentage.
    uint256 internal constant TEN_THOUSAND = 10000;

    uint256 public totalCollateral;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    PairAggregatorInterface public priceOracle;
    LendingPoolInterface public lendingPool;
    LoanTermsConsensusInterface public loanTermsConsensus;

    mapping(address => uint256[]) public borrowerLoans;

    mapping(uint256 => ZeroCollateralCommon.Loan) public loans;

    modifier isBorrower(address borrower) {
        require(msg.sender == borrower, "BORROWER_MUST_BE_SENDER");
        _;
    }

    modifier loanActive(uint256 loanID) {
        require(
            loans[loanID].status == ZeroCollateralCommon.LoanStatus.Active,
            "LOAN_NOT_ACTIVE"
        );
        _;
    }

    modifier loanTermsSet(uint256 loanID) {
        require(
            loans[loanID].status == ZeroCollateralCommon.LoanStatus.TermsSet,
            "LOAN_NOT_SET"
        );
        _;
    }

    modifier loanActiveOrSet(uint256 loanID) {
        require(
            loans[loanID].status == ZeroCollateralCommon.LoanStatus.TermsSet ||
                loans[loanID].status == ZeroCollateralCommon.LoanStatus.Active,
            "LOAN_NOT_ACTIVE_OR_SET"
        );
        _;
    }

    /**
     * @notice Get a list of all loans for a borrower
     * @param borrower address The borrower's address
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    function lendingToken() external view returns (address) {
        return lendingPool.lendingToken();
    }

    /**
     * @notice Withdraw collateral from a loan, unless this isn't allowed
     * @param amount uint256 The amount of collateral token or ether the caller is hoping to withdraw.
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        loanActiveOrSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
    {
        require(msg.sender == loans[loanID].loanTerms.borrower, "CALLER_DOESNT_OWN_LOAN");
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");

        // Find the minimum collateral amount this loan is allowed in tokens
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            _getTotalOwed(loanID),
            loans[loanID].loanTerms.collateralRatio
        );
        uint256 collateralNeededWei = _convertTokenToWei(collateralNeededToken);

        // Withdrawal amount holds the amount of excess collateral in the loan
        uint256 withdrawalAmount = loans[loanID].collateral.sub(collateralNeededWei);
        if (withdrawalAmount > amount) {
            withdrawalAmount = amount;
        }

        if (withdrawalAmount > 0) {
            // Update the contract total and the loan collateral total
            _payOutCollateral(loanID, withdrawalAmount, msg.sender);
        }

        _emitCollateralWithdrawnEvent(loanID, msg.sender, withdrawalAmount);
    }

    /**
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     */
    function takeOutLoan(uint256 loanID, uint256 amountBorrow)
        external
        loanTermsSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
        isBorrower(loans[loanID].loanTerms.borrower)
    {
        require(
            loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );

        require(loans[loanID].termsExpiry >= now, "LOAN_TERMS_EXPIRED");

        require(
            loans[loanID].lastCollateralIn <= now.sub(settings.safetyInterval()),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        loans[loanID].borrowedAmount = amountBorrow;
        loans[loanID].principalOwed = amountBorrow;
        loans[loanID].interestOwed = amountBorrow
            .mul(loans[loanID].loanTerms.interestRate)
            .mul(loans[loanID].loanTerms.duration)
            .div(TEN_THOUSAND)
            .div(DAYS_PER_YEAR_4DP);

        // check that enough collateral has been provided for this loan
        (, , , bool moreCollateralRequired) = _getCollateralInfo(loanID);

        require(!moreCollateralRequired, "MORE_COLLATERAL_REQUIRED");

        loans[loanID].loanStartTime = now;

        loans[loanID].status = ZeroCollateralCommon.LoanStatus.Active;

        // give the recipient their requested amount of tokens
        if (loans[loanID].loanTerms.recipient != address(0)) {
            lendingPool.createLoan(amountBorrow, loans[loanID].loanTerms.recipient);
        } else {
            lendingPool.createLoan(amountBorrow, loans[loanID].loanTerms.borrower);
        }

        _emitLoanTakenOutEvent(loanID, amountBorrow);
    }

    /**
     * @notice Make a payment to a loan
     * @param amount uint256 The amount of tokens to pay back to the loan
     * @param loanID uint256 The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID)
        external
        loanActive(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
    {
        // calculate the actual amount to repay
        uint256 toPay = amount;
        uint256 totalOwed = _getTotalOwed(loanID);
        if (totalOwed < toPay) {
            toPay = totalOwed;
        }

        if (toPay > 0) {
            // update the amount owed on the loan
            totalOwed = totalOwed.sub(toPay);
            _payLoan(loanID, toPay);

            // if the loan is now fully paid, close it and return collateral
            if (totalOwed == 0) {
                loans[loanID].status = ZeroCollateralCommon.LoanStatus.Closed;

                uint256 collateralAmount = loans[loanID].collateral;
                _payOutCollateral(
                    loanID,
                    collateralAmount,
                    loans[loanID].loanTerms.borrower
                );

                _emitCollateralWithdrawnEvent(
                    loanID,
                    loans[loanID].loanTerms.borrower,
                    collateralAmount
                );
            }

            // collect the money from the payer
            lendingPool.repay(toPay, msg.sender);

            _emitLoanRepaidEvent(loanID, toPay, msg.sender, totalOwed);
        }
    }

    /**
     * @notice Liquidate a loan if it is expired or undercollateralised
     * @param loanID uint256 The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID)
        external
        loanActive(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
        nonReentrant()
    {
        // calculate the amount of collateral the loan needs in tokens
        (uint256 loanCollateral, , , bool moreCollateralRequired) = _getCollateralInfo(
            loanID
        );

        // calculate when the loan should end
        uint256 loanEndTime = loans[loanID].loanStartTime.add(
            loans[loanID].loanTerms.duration
        );

        // to liquidate it must be undercollateralised, or expired
        require(moreCollateralRequired || loanEndTime < now, "DOESNT_NEED_LIQUIDATION");

        loans[loanID].status = ZeroCollateralCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        uint256 collateralInTokens = _convertWeiToToken(loanCollateral);

        // the caller gets the collateral from the loan
        _payOutCollateral(loanID, loanCollateral, msg.sender);

        uint256 tokenPayment = collateralInTokens.mul(settings.liquidateEthPrice()).div(
            TEN_THOUSAND
        );
        // the pays tokens at x% of collateral price
        lendingPool.liquidationPayment(tokenPayment, msg.sender);

        _emitLoanLiquidatedEvent(loanID, msg.sender, loanCollateral, tokenPayment);
    }

    function getCollateralInfo(uint256 loanID)
        external
        view
        returns (
            uint256 collateral,
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens,
            bool requireCollateral
        )
    {
        return _getCollateralInfo(loanID);
    }

    /** Internal Functions */

    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal;

    function _emitCollateralWithdrawnEvent(
        uint256 loanID,
        address payable recipient,
        uint256 amount
    ) internal;

    function _emitLoanTakenOutEvent(uint256 loanID, uint256 amountBorrow) internal;

    function _emitLoanRepaidEvent(
        uint256 loanID,
        uint256 amountPaid,
        address payer,
        uint256 totalOwed
    ) internal;

    function _emitLoanLiquidatedEvent(
        uint256 loanID,
        address liquidator,
        uint256 collateralOut,
        uint256 tokensIn
    ) internal;

    function _getCollateralInfo(uint256 loanID)
        internal
        view
        returns (
            uint256 collateral,
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens,
            bool requireCollateral
        )
    {
        collateral = loans[loanID].collateral;
        (
            collateralNeededLendingTokens,
            collateralNeededCollateralTokens
        ) = _getCollateralNeededInfo(
            _getTotalOwed(loanID),
            loans[loanID].loanTerms.collateralRatio
        );
        requireCollateral = collateralNeededCollateralTokens > collateral;
    }

    function _getCollateralNeededInfo(uint256 totalOwed, uint256 collateralRatio)
        internal
        view
        returns (
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens
        )
    {
        // Get collateral needed in lending tokens.
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            totalOwed,
            collateralRatio
        );
        // Convert collateral (in lending tokens) into collateral tokens.
        return (collateralNeededToken, _convertTokenToWei(collateralNeededToken));
    }

    function _initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress
    ) internal isNotInitialized() {
        require(priceOracleAddress != address(0), "PROVIDE_ORACLE_ADDRESS");
        require(lendingPoolAddress != address(0), "PROVIDE_LENDINGPOOL_ADDRESS");
        require(loanTermsConsensusAddress != address(0), "PROVIDED_LOAN_TERMS_ADDRESS");

        _initialize(settingsAddress);

        priceOracle = PairAggregatorInterface(priceOracleAddress);
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        loanTermsConsensus = LoanTermsConsensusInterface(loanTermsConsensusAddress);
    }

    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        totalCollateral = totalCollateral.add(amount);
        loans[loanID].collateral = loans[loanID].collateral.add(amount);
        loans[loanID].lastCollateralIn = now;
    }

    function _payLoan(uint256 loanID, uint256 toPay) internal {
        if (toPay > loans[loanID].principalOwed) {
            uint256 leftToPay = toPay;
            leftToPay = leftToPay.sub(loans[loanID].principalOwed);
            loans[loanID].principalOwed = 0;
            loans[loanID].interestOwed = loans[loanID].interestOwed.sub(leftToPay);
        } else {
            loans[loanID].principalOwed = loans[loanID].principalOwed.sub(toPay);
        }
    }

    function _getTotalOwed(uint256 loanID) internal view returns (uint256) {
        return loans[loanID].interestOwed.add(loans[loanID].principalOwed);
    }

    function _getAWholeLendingToken() internal view returns (uint256) {
        uint8 decimals = ERC20Detailed(lendingPool.lendingToken()).decimals();
        return TEN**decimals;
    }

    function _getCollateralNeededInTokens(uint256 loanAmount, uint256 collateralRatio)
        internal
        pure
        returns (uint256)
    {
        // gets the amount of collateral needed in lending tokens (not wei)
        return loanAmount.mul(collateralRatio).div(TEN_THOUSAND);
    }

    function _convertWeiToToken(uint256 weiAmount) internal view returns (uint256) {
        // wei amount / lending token price in wei * the lending token decimals.
        uint256 aWholeLendingToken = _getAWholeLendingToken();
        uint256 oneLendingTokenPriceWei = uint256(priceOracle.getLatestAnswer());
        uint256 weiValue = weiAmount.mul(aWholeLendingToken).div(oneLendingTokenPriceWei);
        return weiValue;
    }

    function _convertTokenToWei(uint256 tokenAmount) internal view returns (uint256) {
        // tokenAmount is in token units, chainlink price is in whole tokens
        // token amount in tokens * lending token price in wei / the lending token decimals.
        uint256 aWholeLendingToken = _getAWholeLendingToken();
        uint256 oneLendingTokenPriceWei = uint256(priceOracle.getLatestAnswer());
        uint256 tokenValue = tokenAmount.mul(oneLendingTokenPriceWei).div(
            aWholeLendingToken
        );
        return tokenValue;
    }

    function getAndIncrementLoanID() internal returns (uint256 newLoanID) {
        newLoanID = loanIDCounter;
        loanIDCounter += 1;
    }

    function createLoan(
        uint256 loanID,
        ZeroCollateralCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal view returns (ZeroCollateralCommon.Loan memory) {
        uint256 termsExpiry = now.add(settings.termsExpiryTime());
        return
            ZeroCollateralCommon.Loan({
                id: loanID,
                loanTerms: ZeroCollateralCommon.LoanTerms({
                    borrower: request.borrower,
                    recipient: request.recipient,
                    interestRate: interestRate,
                    collateralRatio: collateralRatio,
                    maxLoanAmount: maxLoanAmount,
                    duration: request.duration
                }),
                termsExpiry: termsExpiry,
                loanStartTime: 0,
                collateral: 0,
                lastCollateralIn: 0,
                principalOwed: 0,
                interestOwed: 0,
                borrowedAmount: 0,
                status: ZeroCollateralCommon.LoanStatus.TermsSet,
                liquidated: false
            });
    }
}
