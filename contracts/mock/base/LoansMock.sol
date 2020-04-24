// This is just to be used as a LendingPool template for the gnosis Mock Contracts, until the LendingPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Loans.sol";
import "../../util/ZeroCollateralCommon.sol";

contract LoansMock is Loans {

    constructor(address priceOracleAddress, address lendingPoolAddress, address requestedLoanConsensusAddress, uint256 aTimeWindowToTakeOutLoan)
        public
        Loans(priceOracleAddress, lendingPoolAddress, requestedLoanConsensusAddress, aTimeWindowToTakeOutLoan) { }

    function setLoanIDCounter(uint256 newLoanIdCounter)
        external
    {
        loanIDCounter = newLoanIdCounter;
    }

    function mockRequestedLoan(
        address payable borrower,
        uint256 id,
        uint256 amount,
        uint256 numberOfDays,
        uint256 maxLoanAmount,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 processedAt,
        ZeroCollateralCommon.RequestedLoanStatus status)
        external
    {
        requestedLoans[id].borrower = borrower;
        requestedLoans[id].id = id;
        requestedLoans[id].amount = amount;
        requestedLoans[id].numberOfDays = numberOfDays;
        requestedLoans[id].maxLoanAmount = maxLoanAmount;
        requestedLoans[id].interestRate = interestRate;
        requestedLoans[id].collateralRatio = collateralRatio;
        requestedLoans[id].processedAt = processedAt;
        requestedLoans[id].status = status;
    }
}