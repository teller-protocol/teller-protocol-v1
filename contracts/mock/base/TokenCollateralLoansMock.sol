pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/TokenCollateralLoans.sol";

contract TokenCollateralLoansMock is TokenCollateralLoans {
    bool public mockTokenFunctions;

    function setMockTokenFunctions(bool newMockTokenFunctions) external {
        mockTokenFunctions = newMockTokenFunctions;
    }

    function setLoanIDCounter(uint256 newLoanIdCounter) external {
        loanIDCounter = newLoanIdCounter;
    }

    function setTotalCollateral(uint256 amount) external {
        totalCollateral = amount;
    }

    function setLoan(TellerCommon.Loan memory loan) public {
        totalCollateral += loan.collateral;
        loans[loan.id] = loan;
    }

    function _collateralTokenTransfer(address recipient, uint256 amount) internal {
        if (!mockTokenFunctions) {
            super._collateralTokenTransfer(recipient, amount);
        }
    }

    function _collateralTokenTransferFrom(address from, uint256 amount) internal {
        if (!mockTokenFunctions) {
            super._collateralTokenTransferFrom(from, amount);
        }
    }
}
