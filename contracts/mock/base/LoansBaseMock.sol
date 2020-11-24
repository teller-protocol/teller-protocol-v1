pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "./BaseMock.sol";
import "../../base/LoansBase.sol";

contract LoansBaseMock is LoansBase, BaseMock {
    TellerCommon.LoanLiquidationInfo public _mockLiquidationInfo;
    bool public _mockLiquidationInfoSet;
    TellerCommon.LoanLiquidationInfo public _mockPayOutInfo;
    uint256 _mockPayOutInfoLoanID;
    address public _mockPayOutInfoRecipient;
    bool public _mockPayOutInfoSet;

    mapping(uint256 => TellerCommon.LoanCollateralInfo) internal mockCollateralInfo;

    function _payOutCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {}

    function externalPayLoan(uint256 loanID, uint256 toPay) external {
        loans[loanID].payOff(toPay);
    }

    function externalIsSupplyToDebtRatioValid(uint256 newLoanAmount)
        external
        view
        returns (bool)
    {
        return super._isSupplyToDebtRatioValid(newLoanAmount);
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
        require(
            loan.loanTerms.maxLoanAmount >= loan.borrowedAmount,
            "BORROWED_AMOUNT_EXCEEDS_MAX"
        );
        loans[loan.id] = loan;
    }

    function setEscrowForLoan(uint256 loanID, address escrowAddress) external {
        loans[loanID].escrow = escrowAddress;
    }

    function externalEscrowClaimTokens(uint256 loanID) external {
        EscrowInterface(loans[loanID].escrow).claimTokens();
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

    function mockPayOutLiquidator(
        uint256 loanID,
        TellerCommon.LoanLiquidationInfo memory liquidationInfo,
        address payable recipient
    ) public {
        _mockPayOutInfo = liquidationInfo;
        _mockPayOutInfoLoanID = loanID;
        _mockPayOutInfoRecipient = recipient;
        _mockPayOutInfoSet = true;
    }

    function _payOutLiquidator(
        uint256 loanID,
        TellerCommon.LoanLiquidationInfo memory liquidationInfo,
        address payable recipient
    ) internal {
        if (!_mockPayOutInfoSet) {
            super._payOutLiquidator(loanID, liquidationInfo, recipient);
        }
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

    function _getCollateralNeededInfo(uint256 loanID)
        internal
        view 
        returns (
            int256 neededInLending,
            int256 neededInCollateral,
            uint256 escrowLoanValue
        )
    {
        TellerCommon.LoanCollateralInfo memory info = mockCollateralInfo[loanID];
        neededInLending = info.neededInLendingTokens;
        neededInCollateral = info.neededInCollateralTokens;
        escrowLoanValue = info.collateral;
        if (info.collateral == 0) {
            (neededInLending, neededInCollateral, escrowLoanValue) = super._getCollateralNeededInfo(loanID);
        }
    }

    function initialize(
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address
    ) external isNotInitialized() {
        _initialize(lendingPoolAddress, loanTermsConsensusAddress, settingsAddress);
    }

    function depositCollateral(
        address borrower,
        uint256 loanID,
        uint256 amount
    ) external payable {}

    function createLoanWithTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    ) external payable {}

    function externalCreateEscrow(uint256 loanID) external returns (address) {
        return super._createEscrow(loanID);
    }
}
