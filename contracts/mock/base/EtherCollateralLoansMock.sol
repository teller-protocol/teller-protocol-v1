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

    function setEscrowForLoan(uint256 loanID, address escrowAddress) external {
        loans[loanID].escrow = escrowAddress;
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
            escrow: address(0x0),
            status: status,
            liquidated: liquidated
        });
    }

    function setLoan(TellerCommon.Loan memory loan) public {
        require(loan.loanTerms.maxLoanAmount >= loan.borrowedAmount, "BORROWED_AMOUNT_EXCEEDS_MAX");
        totalCollateral += loan.collateral;
        loans[loan.id] = loan;
    }

    function externalCreateEscrow(uint256 loanID) external returns (address) {
        return super._createEscrow(loanID);
    }

    function externalSetSettings(address settingsAddress) external {
        _setSettings(settingsAddress);
    }

    function() external payable {}
}
