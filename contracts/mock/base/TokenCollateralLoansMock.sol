pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/TokenCollateralLoans.sol";

contract TokenCollateralLoansMock is TokenCollateralLoans {

    bool public requireExpectedBalance = true;

    function mockRequireExpectedBalance(bool aRequireExpectedBalance)
        external
    {
        requireExpectedBalance = aRequireExpectedBalance;
    }

    function setLoanIDCounter(uint256 newLoanIdCounter)
        external
    {
        loanIDCounter = newLoanIdCounter;
    }

    function setBorrowerLoans(address borrower, uint256[] calldata loanIDs) external {
        borrowerLoans[borrower] = loanIDs;
    }

    function setTotalCollateral(uint256 amount) external {
        totalCollateral = amount;
    }

    function setLoan(
        uint256 id,
        ZeroCollateralCommon.LoanTerms calldata loanTerms,
        uint256 termsExpiry,
        uint256 loanStartTime,
        uint256 collateral,
        uint256 lastCollateralIn,
        uint256 principalOwed,
        uint256 interestOwed,
        uint256 borrowedAmount,
        ZeroCollateralCommon.LoanStatus status,
        bool liquidated
    ) external {
        require(loanTerms.maxLoanAmount >= borrowedAmount, "BORROWED_AMOUNT_EXCEEDS_MAX");
        totalCollateral += collateral;
        loans[id] = ZeroCollateralCommon.Loan({
            id: id,
            loanTerms: loanTerms,
            termsExpiry: termsExpiry,
            loanStartTime: loanStartTime,
            collateral: collateral,
            lastCollateralIn: lastCollateralIn,
            principalOwed: principalOwed,
            interestOwed: interestOwed,
            borrowedAmount: borrowedAmount,
            status: status,
            liquidated: liquidated
        });
    }

    function _requireExpectedBalance(uint256, uint256, bool) internal view {
        require(requireExpectedBalance, "INV_BALANCE_AFTER_TRANSFER_FROM");
    }

    function externalRequireExpectedBalance(uint256 initialBalance, uint256 expectedAmount, bool isTransfer) external view {
        super._requireExpectedBalance(initialBalance, expectedAmount, isTransfer);
    }
}