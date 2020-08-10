pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";


contract EtherCollateralLoansMock is EtherCollateralLoans {
    function setLoanIDCounter(uint256 newLoanIdCounter) external {
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
        TellerCommon.LoanTerms calldata loanTerms,
        uint256 termsExpiry,
        uint256 loanStartTime,
        uint256 collateral,
        uint256 lastCollateralIn,
        uint256 principalOwed,
        uint256 interestOwed,
        uint256 borrowedAmount,
        TellerCommon.LoanStatus status,
        bool liquidated
    ) external {
        require(loanTerms.maxLoanAmount >= borrowedAmount, "BORROWED_AMOUNT_EXCEEDS_MAX");
        totalCollateral += collateral;
        loans[id] = TellerCommon.Loan({
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

    function createEscrow(uint256 loanID) public {
        settings.getEscrowFactory().createEscrow(loanID);
    }

    function() external payable {}
}
