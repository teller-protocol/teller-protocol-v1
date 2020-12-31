pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/EtherCollateralLoans.sol";

contract EtherCollateralLoansMock is EtherCollateralLoans {
    TellerCommon.LoanLiquidationInfo _mockLiquidationInfo;
    bool _mockLiquidationInfoSet;

    mapping(uint256 => TellerCommon.LoanCollateralInfo) internal mockCollateralInfo;

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

    function mockGetCollateralInfo(
        uint256 loanID,
        int256 neededInLending,
        int256 neededInCollateral
    ) external {
        mockCollateralInfo[loanID].collateral = loans[loanID].collateral;
        mockCollateralInfo[loanID].neededInLendingTokens = neededInLending;
        mockCollateralInfo[loanID].neededInCollateralTokens = neededInCollateral;
        mockCollateralInfo[loanID].moreCollateralRequired =
            neededInCollateral > int256(loans[loanID].collateral);
    }

    function _getCollateralInfo(uint256 loanID)
        internal
        view
        returns (TellerCommon.LoanCollateralInfo memory info)
    {
        info = mockCollateralInfo[loanID];
        if (info.collateral == 0) {
            info = super._getCollateralInfo(loanID);
        }
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
