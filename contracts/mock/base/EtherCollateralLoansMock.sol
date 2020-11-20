pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";

contract EtherCollateralLoansMock is EtherCollateralLoans {
    TellerCommon.LoanLiquidationInfo _mockLiquidationInfo;
    bool _mockLiquidationInfoSet;

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

    function mockLiquidationInfo(TellerCommon.LoanLiquidationInfo memory liquidationInfo)
        public
    {
        _mockLiquidationInfo = liquidationInfo;
        _mockLiquidationInfoSet = true;
    }

    function _getLiquidationInfo(uint256 loanID)
        internal
        view
        returns (TellerCommon.LoanLiquidationInfo memory)
    {
        if (_mockLiquidationInfoSet) {
            return _mockLiquidationInfo;
        } else {
            return super._getLiquidationInfo(loanID);
        }
    }

    function setLoan(TellerCommon.Loan memory loan) public {
        require(
            loan.loanTerms.maxLoanAmount >= loan.borrowedAmount,
            "BORROWED_AMOUNT_EXCEEDS_MAX"
        );
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
