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

// Libraries
import "../util/ZeroCollateralCommon.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Contracts
import "openzeppelin-solidity/contracts/token/ERC20/ERC20Detailed.sol";

// Interfaces
import "../interfaces/LoansInterface.sol";
import "../interfaces/PairAggregatorInterface.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";


contract Loans is LoansInterface {
    using SafeMath for uint256;

    uint256 private constant ONE_HOUR = 60 * 60;
    uint256 private constant ONE_DAY = ONE_HOUR * 24;
    uint256 private constant THIRTY_DAYS = ONE_DAY * 30;
    uint256 private constant LIQUIDATE_ETH_PRICE = 9500; // Eth is bought at 95.00% of the going rate
    uint256 private constant TEN = 10; // Used to calculate one whole token.
    uint256 private constant HOURS_PER_YEAR = 365 * 24;
    uint256 private constant TEN_THOUSAND = 10000; // For interestRate, collateral, and liquidation price, 7% is represented as 700.
    // to find the value of something we must divide 700 by 100 to remove decimal places, and another 100 for percentage

    uint256 public totalCollateral;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    PairAggregatorInterface public priceOracle;
    LendingPoolInterface public lendingPool;
    LoanTermsConsensusInterface public loanTermsConsensus;

    uint256 safetyInterval;

    mapping(address => uint256[]) public borrowerLoans;

    mapping(uint256 => ZeroCollateralCommon.Loan) public loans;

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

    constructor(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        uint256 initSafetyInterval
    ) public {
        require(priceOracleAddress != address(0), "PROVIDE_ORACLE_ADDRESS");
        require(lendingPoolAddress != address(0), "PROVIDE_LENDINGPOOL_ADDRESS");
        require(
            loanTermsConsensusAddress != address(0),
            "Consensus address is required."
        );
        require(initSafetyInterval > 0, "PROVIDE_SAFETY_INTERVAL");

        priceOracle = PairAggregatorInterface(priceOracleAddress);
        lendingPool = LendingPoolInterface(lendingPoolAddress);
        loanTermsConsensus = LoanTermsConsensusInterface(loanTermsConsensusAddress);
        safetyInterval = initSafetyInterval;
    }

    /**
     * @notice Get a list of all loans for a borrower
     * @param borrower address The borrower's address
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory) {
        return borrowerLoans[borrower];
    }

    /**
     * @notice Deposit collateral into a loan
     * @param borrower address The address of the loan borrower.
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function depositCollateral(address borrower, uint256 loanID)
        external
        payable
        loanActiveOrSet(loanID)
    {
        require(
            loans[loanID].loanTerms.borrower == borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );

        require(msg.value > 0, "CANNOT_DEPOSIT_ZERO");

        uint256 depositAmount = msg.value;

        // update the contract total and the loan collateral total
        _payInCollateral(loanID, depositAmount);

        emit CollateralDeposited(loanID, borrower, depositAmount);
    }

    /**
     * @notice Withdraw collateral from a loan, unless this isn't allowed
     * @param amount uint256 The amount of ETH the caller is hoping to withdraw
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        loanActiveOrSet(loanID)
    {
        require(msg.sender == loans[loanID].loanTerms.borrower, "CALLER_DOESNT_OWN_LOAN");
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");

        // Find the minimum collateral amount this loan is allowed in tokens
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            loans[loanID].totalOwed,
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

        emit CollateralWithdrawn(loanID, msg.sender, withdrawalAmount);
    }

    function setLoanTerms(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses
    ) external payable {
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 maxLoanAmount;

        uint256 loanID = loanIDCounter;
        loanIDCounter += 1;

        (interestRate, collateralRatio, maxLoanAmount) = loanTermsConsensus
            .processRequest(request, responses);

        loans[loanID] = ZeroCollateralCommon.Loan({
            id: loanID,
            loanTerms: ZeroCollateralCommon.LoanTerms({
                borrower: request.borrower,
                recipient: request.recipient,
                maxLoanAmount: maxLoanAmount,
                collateralRatio: collateralRatio,
                interestRate: interestRate,
                duration: request.duration
            }),
            termsExpiry: now.add(THIRTY_DAYS),
            loanStartTime: 0,
            collateral: 0,
            lastCollateralIn: 0,
            totalOwed: 0,
            status: ZeroCollateralCommon.LoanStatus.TermsSet,
            liquidated: false
        });

        if (msg.value > 0) {
        // update collateral, totalCollateral, and lastCollateralIn
            _payInCollateral(loanID, msg.value);
        }

        borrowerLoans[request.borrower].push(loanID);
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
    {
        require(
            loans[loanID].loanTerms.maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );

        require(loans[loanID].termsExpiry <= now, "LOAN_TERMS_EXPIRED");

        require(
            loans[loanID].lastCollateralIn <= now.sub(safetyInterval),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        // check caller is borrower or recipient?

        // check that enough collateral has been provided for this loan
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            amountBorrow,
            loans[loanID].loanTerms.collateralRatio
        );
        uint256 collateralNeededWei = _convertTokenToWei(collateralNeededToken);

        require(
            loans[loanID].collateral >= collateralNeededWei,
            "MORE_COLLATERAL_REQUIRED"
        );

        loans[loanID].loanStartTime = now;

        // durationInHours is rounded up to the next hour
        uint256 durationInHours = loans[loanID].loanTerms.duration.div(ONE_HOUR);
        if (loans[loanID].loanTerms.duration.mod(ONE_HOUR) > 0) {
            durationInHours++;
        }

        loans[loanID].totalOwed = amountBorrow.add(
            amountBorrow
                .mul(loans[loanID].loanTerms.interestRate)
                .mul(durationInHours)
                .div(TEN_THOUSAND)
                .div(HOURS_PER_YEAR)
        );
        loans[loanID].status = ZeroCollateralCommon.LoanStatus.Active;

        // give the recipient their requested amount of tokens
        if (loans[loanID].loanTerms.recipient != address(0)) {
            lendingPool.createLoan(amountBorrow, loans[loanID].loanTerms.recipient);
        } else {
            lendingPool.createLoan(amountBorrow, loans[loanID].loanTerms.borrower);
        }
    }

    /**
     * @notice Make a payment to a loan
     * @param amount uint256 The amount of tokens to pay back to the loan
     * @param loanID uint256 The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID) external loanActive(loanID) {
        // calculate the actual amount to repay
        uint256 toPay = amount;
        if (loans[loanID].totalOwed < toPay) {
            toPay = loans[loanID].totalOwed;
        }

        if (toPay > 0) {
            // update the amount owed on the loan
            loans[loanID].totalOwed = loans[loanID].totalOwed.sub(toPay);

            // if the loan is now fully paid, close it and return collateral
            if (loans[loanID].totalOwed == 0) {
                loans[loanID].status = ZeroCollateralCommon.LoanStatus.Closed;

                _payOutCollateral(
                    loanID,
                    loans[loanID].collateral,
                    loans[loanID].loanTerms.borrower
                );
            }

            // collect the money from the payer
            lendingPool.repay(toPay, msg.sender);
        }
    }

    /**
     * @notice Liquidate a loan if it is expired or undercollateralised
     * @param loanID uint256 The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID) external loanActive(loanID) {
        // calculate the amount of collateral the loan needs in tokens
        uint256 collateralNeededToken = _getCollateralNeededInTokens(
            loans[loanID].totalOwed,
            loans[loanID].loanTerms.collateralRatio
        );
        uint256 collateralNeededWei = _convertTokenToWei(collateralNeededToken);

        // calculate when the loan should end
        uint256 loanEndTime = loans[loanID].loanStartTime.add(
            loans[loanID].loanTerms.duration
        );

        // to liquidate it must be undercollateralised, or expired
        require(
            collateralNeededWei > loans[loanID].collateral || loanEndTime < now,
            "DOESNT_NEED_LIQUIDATION"
        );

        loans[loanID].status = ZeroCollateralCommon.LoanStatus.Closed;
        loans[loanID].liquidated = true;

        uint256 collateralInTokens = _convertWeiToToken(loans[loanID].collateral);

        // the caller gets the collateral from the loan
        _payOutCollateral(loanID, loans[loanID].collateral, msg.sender);

        // the pays tokens at x% of collateral price
        lendingPool.liquidationPayment(
            collateralInTokens.mul(LIQUIDATE_ETH_PRICE).div(TEN_THOUSAND),
            msg.sender
        );
    }

    function _hashLoan(
        uint256 interestRate,
        uint256 collateralRatio,
        address borrower,
        uint256 maxLoanAmount,
        uint256 numberDays,
        uint256 signerNonce
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    interestRate,
                    collateralRatio,
                    borrower,
                    maxLoanAmount,
                    numberDays,
                    signerNonce
                )
            );
    }

    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal
    {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);
        recipient.transfer(amount);
    }

    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        totalCollateral = totalCollateral.add(amount);
        loans[loanID].collateral = loans[loanID].collateral.add(amount);
        loans[loanID].lastCollateralIn = now;
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
}
