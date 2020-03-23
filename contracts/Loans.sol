pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import './interfaces/LoansInterface.sol';
import './interfaces/PairAggregatorInterface.sol';
import './interfaces/DAIPoolInterface.sol';
import './util/ZeroCollateralCommon.sol';
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "openzeppelin-solidity/contracts/access/roles/SignerRole.sol";

contract Loans is LoansInterface, SignerRole {
    using SafeMath for uint256;

    uint256 constant private ONE_HOUR = 3600;
    uint256 constant private ONE_DAY = 3600*24;

    uint256 public totalCollateral;

    // At any time, this variable stores the next available loan ID
    uint256 public loanIDCounter;

    PairAggregatorInterface priceOracle;
    DAIPoolInterface daiPool;

    mapping(address => uint256[]) borrowerLoans;

    mapping(uint256 => ZeroCollateralCommon.Loan) loans;

    mapping(address => mapping(uint256 => bool)) signerNonceTaken;

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
        totalCollateral = totalCollateral.add(depositAmount);
        loans[loanID].collateral = loans[loanID].collateral.add(depositAmount);

        emit CollateralDeposited(loanID, borrower, depositAmount);
    }

    /**
     * @notice Withdraw collateral from a loan, unless this isn't allowed
     * @param amount uint256 The amount of ETH the caller is hoping to withdraw
     * @param loanID uint256 The ID of the loan the collateral is for
     */
    function withdrawCollateral(uint256 amount, uint256 loanID) external loanIDValid(loanID) {
        require(msg.sender == loans[loanID].borrower, "CALLER_DOESNT_OWN_LOAN");

        // Find the minimum collateral amount this loan is allowed
        uint256 minimumCollateral = getMinimumAllowedCollateral(loanID);

        // withdrawal amount holds the amoutn of excess collateral in the loan
        uint256 withdrawalAmount = loans[loanID].collateral.sub(minimumCollateral);
        if (withdrawalAmount > amount) {
          withdrawalAmount = amount;
        }

        if (withdrawalAmount > 0) {
          msg.sender.transfer(withdrawalAmount);
        }

        emit CollateralDeposited(loanID, msg.sender, withdrawalAmount);
    }

    function takeOutLoan(
        uint8 interestRate,
        uint8 collateralRatio,
        uint256 maxLoanAmount,
        uint256 numberDays,
        uint256 amountBorrow,
        ZeroCollateralCommon.Signature calldata signature
    ) external payable returns (uint256 loanID) {
        // collateral ratio is a percentage of the loan amount that's required in collateral
        // the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
        // is required in the loan.

        // interest rate is also a percentage with 2 decimal points

        require(amountBorrow <= maxLoanAmount, "BORROW_AMOUNT_NOT_AUTHORIZED");

        bytes32 hashedLoan = hashLoanInfo(interestRate, collateralRatio, msg.sender, maxLoanAmount, numberDays, signature.signerNonce);
        address signer = ecrecover(hashedLoan, signature.v, signature.r, signature.s);

        // check that the signer and signature are valid and that the signature not double spent
        require(isSigner(signer), "SIGNER_NOT_AUTHORIZED");
        require(!signerNonceTaken[signer][signature.signerNonce], "SIGNER_NONCE_TAKEN");

        signerNonceTaken[signer][signature.signerNonce] = true;

        // check that enough collateral has been provided for this loan
        require(priceOracle.getLatestTimestamp() >= now.sub(ONE_HOUR), "ORACLE_PRICE_OLD");

        uint256 ethPrice = uint256(priceOracle.getLatestAnswer());
        uint256 minCollateralDAI = amountBorrow.mul(collateralRatio).div(100);
        // TODO - CHECK DECIMALS ON ETH PRICE
        require(msg.value.mul(ethPrice) >= minCollateralDAI, "MORE_COLLATERAL_REQUIRED");

        // Create the loan
        loans[loanIDCounter] = ZeroCollateralCommon.Loan ({
            id: loanIDCounter,
            borrower: msg.sender,
            active: true,
            liquidated: false,
            collateral: msg.value,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            totalOwed: amountBorrow.add(amountBorrow.mul(interestRate).mul(numberDays).div(100).div(365)),
            blockStart: now,
            blockEnd: now.add(numberDays.mul(ONE_DAY))
        });

        // add loanID to the borrower's list of loans
        borrowerLoans[msg.sender].push(loanIDCounter);
        loanIDCounter += 1;

        // give the borrower their requested amount of DAI
        daiPool.createLoan(amountBorrow, msg.sender);

        return loanIDCounter-1;
    }


    // function withdrawDai(uint256 amount, uint256 loanID) external;

    function repayDai(uint256 amount, uint256 loanID) external loanIDValid(loanID) {
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
          }

          daiPool.repayDai(toPay, msg.sender);
        }

    }

    function liquidateLoan(uint256 loanID) external loanIDValid(loanID) {

    }

    function getMinimumAllowedCollateral(uint256 loanID) internal view returns (uint256) {
        uint256 loanAmount = loans[loanID].totalOwed;
        uint8 collateralRatio = loans[loanID].collateralRatio;

        return loanAmount.mul(collateralRatio).div(100);
    }

    function hashLoanInfo(
      uint8 interestRate,
      uint8 collateralRatio,
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

}
