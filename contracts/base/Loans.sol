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

import '../interfaces/LoansInterface.sol';
import '../interfaces/PairAggregatorInterface.sol';
import '../interfaces/DAIPoolInterface.sol';
import '../util/ZeroCollateralCommon.sol';
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/roles/SignerRole.sol";

contract Loans is LoansInterface, SignerRole {
    using SafeMath for uint256;

    uint256 constant private ONE_HOUR = 3600;
    uint256 constant private ONE_DAY = 3600*24;
    uint256 constant private LIQUIDATE_ETH_PRICE = 95; // Eth is bought at 95% of the going rate
    uint256 constant private ONE_HUNDRED = 100; // Used when finding a percentage of a number - divide by 100
    uint256 constant private DAYS_PER_YEAR = 365;
    uint256 constant private TEN_THOUSAND = 10000; // For interest and collateral, 7% is represented as 700.
        // to find the value of something we must divide 700 by 100 to remove decimal places, and another 100 for percentage

    uint256 public totalCollateral;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    PairAggregatorInterface public priceOracle;
    DAIPoolInterface public daiPool;

    mapping(address => uint256[]) private borrowerLoans;

    mapping(uint256 => ZeroCollateralCommon.Loan) public loans;

    mapping(address => mapping(uint256 => bool)) public signerNonceTaken;

    modifier loanIDValid(uint256 loanID) {
      require(loanID < loanIDCounter, "LOAN_ID_INVALID");
      _;
    }

    constructor(
      address priceOracleAddress,
      address daiPoolAddress
    ) public {
      require(priceOracleAddress != address(0), "PROVIDE_ORACLE_ADDRESS");
      require(daiPoolAddress != address(0), "PROVIDE_DAIPOOL_ADDRESS");

      priceOracle = PairAggregatorInterface(priceOracleAddress);
      daiPool = DAIPoolInterface(daiPoolAddress);
    }

    /**
     * @notice Deposit collateral into a loan
     * @param borrower address The address of the loan borrower.
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function depositCollateral(address borrower, uint256 loanID) external payable loanIDValid(loanID) {
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
    function withdrawCollateral(uint256 amount, uint256 loanID) external loanIDValid(loanID) {
        require(msg.sender == loans[loanID].borrower, "CALLER_DOESNT_OWN_LOAN");

        // Find the minimum collateral amount this loan is allowed in DAI
        uint256 minimumCollateralDAI = getMinimumAllowedCollateralDAI(loanID);

        require(priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR), "ORACLE_PRICE_OLD");

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

    /**
     * @notice Take out a loan
     * @param interestRate uint256 The interest rate of the loan
     * @param collateralRatio uint256 The ratio of colalteral to principal required
     * @param maxLoanAmount uint256 The maximum amount of DAI allowed
     * @param numberDays uint256 The length of the loan
     * @param amountBorrow uint256 The initial amount to draw out for the loan
     * @param signature ZeroCollateralCommon.Signature A signature from an authorized signer
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     */
    function takeOutLoan(
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount,
        uint256 numberDays,
        uint256 amountBorrow,
        ZeroCollateralCommon.Signature calldata signature
    ) external payable returns (uint256 loanID) {
        require(amountBorrow <= maxLoanAmount, "BORROW_AMOUNT_NOT_AUTHORIZED");

        address signer = ecrecover(
            keccak256(
              abi.encodePacked(
                "\x19Ethereum Signed Message:\n32",
                hashLoan(interestRate, collateralRatio, msg.sender, maxLoanAmount, numberDays, signature.signerNonce)
              )
            ),
            signature.v,
            signature.r,
            signature.s
        );

        // check that the signer and signature are valid and that the signature not double spent
        require(isSigner(signer), "SIGNER_NOT_AUTHORIZED");
        require(!signerNonceTaken[signer][signature.signerNonce], "SIGNER_NONCE_TAKEN");

        signerNonceTaken[signer][signature.signerNonce] = true;

        // check that enough collateral has been provided for this loan
        require(priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR), "ORACLE_PRICE_OLD");

        uint256 ethPrice = uint256(priceOracle.getLatestAnswer());

        // TODO - CHECK DECIMALS ON ETH PRICE
        require(msg.value.mul(ethPrice) >= amountBorrow.mul(collateralRatio).div(TEN_THOUSAND), "MORE_COLLATERAL_REQUIRED");

        // Create the loan
        createNewLoan(interestRate, collateralRatio, maxLoanAmount, numberDays, amountBorrow);

        // add loanID to the borrower's list of loans
        borrowerLoans[msg.sender].push(loanIDCounter);
        loanIDCounter += 1;

        // give the borrower their requested amount of DAI
        daiPool.createLoan(amountBorrow, msg.sender);

        totalCollateral = totalCollateral.add(msg.value);

        emit LoanCreated(
            loanID,
            msg.sender,
            interestRate,
            collateralRatio,
            maxLoanAmount,
            numberDays
        );

        return loanIDCounter-1;
    }


    /**
     * @notice Make a payment to a loan
     * @param amount uint256 The amount of DAI to pay back to the loan
     * @param loanID uint256 The ID of the loan the payment is for
     */
    function repayDai(uint256 amount, uint256 loanID) external loanIDValid(loanID) {
        require(loans[loanID].active, "LOAN_NOT_ACTIVE");

        // calculate the actual amount to repay
        uint256 toPay = amount;
        if (loans[loanID].totalOwed < toPay) {
          toPay = loans[loanID].totalOwed;
        }

        if (toPay > 0) {
          // update the loan
          loans[loanID].totalOwed = loans[loanID].totalOwed.sub(toPay);
          if(loans[loanID].totalOwed == 0) {
            loans[loanID].active = false;

            payOutCollateral(loanID, loans[loanID].collateral, loans[loanID].borrower);
          }

          daiPool.repayDai(toPay, msg.sender);
        }

    }

    /**
     * @notice Liquidate a loan if it is expired or undercollateralised
     * @param loanID uint256 The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID) external loanIDValid(loanID) {
        require(loans[loanID].active, "LOAN_NOT_ACTIVE");

        // check that enough collateral has been provided for this loan
        require(priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR), "ORACLE_PRICE_OLD");

        uint256 ethPrice = uint256(priceOracle.getLatestAnswer());
        uint256 collateralInDAI = loans[loanID].collateral.mul(ethPrice);
        uint256 minCollateralDAI = getMinimumAllowedCollateralDAI(loanID);
        // TODO - CHECK DECIMALS ON ETH PRICE

        // must be under collateralised or expired
        require(minCollateralDAI > collateralInDAI || loans[loanID].timeEnd < now, "DOESNT_NEED_LIQUIDATION");

        loans[loanID].active = false;

        // the msg.sender pays DAI at 95% of collateral price
        daiPool.liquidationPayment(collateralInDAI.mul(LIQUIDATE_ETH_PRICE).div(ONE_HUNDRED), msg.sender);

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

    function getMinimumAllowedCollateralDAI(uint256 loanID) internal view returns (uint256) {
        uint256 loanAmount = loans[loanID].totalOwed;
        uint256 collateralRatio = loans[loanID].collateralRatio;

        return loanAmount.mul(collateralRatio).div(TEN_THOUSAND);
    }

    function hashLoan(
      uint256 interestRate,
      uint256 collateralRatio,
      address borrower,
      uint256 maxLoanAmount,
      uint256 numberDays,
      uint256 signerNonce
    ) internal pure returns (bytes32) {
        return keccak256(abi.encode(
            interestRate,
            collateralRatio,
            borrower,
            maxLoanAmount,
            numberDays,
            signerNonce
        ));
    }

    function payOutCollateral(uint256 loanID, uint256 amount, address payable recipient) internal {
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
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount,
        uint256 numberDays,
        uint256 amountBorrow
    ) internal {
        loans[loanIDCounter] = ZeroCollateralCommon.Loan ({
            id: loanIDCounter,
            collateral: msg.value,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            totalOwed: amountBorrow.add(amountBorrow.mul(interestRate).mul(numberDays).div(TEN_THOUSAND).div(DAYS_PER_YEAR)),
            timeStart: now,
            timeEnd: now.add(numberDays.mul(ONE_DAY)),
            borrower: msg.sender,
            active: true,
            liquidated: false
        });
    }

}
