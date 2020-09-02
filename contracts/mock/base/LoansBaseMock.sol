pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "./BaseMock.sol";
import "../../base/LoansBase.sol";


contract LoansBaseMock is LoansBase, BaseMock {
    mapping(uint256 => TellerCommon.LoanCollateralInfo) internal mockCollateralInfo;

    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal
    {}

    function externalPayLoan(uint256 loanID, uint256 toPay) external {
        _payLoan(loanID, toPay);
    }

    function externalConvertWeiToToken(uint256 weiAmount)
        external
        view
        returns (uint256)
    {
        return _convertWeiToToken(weiAmount);
    }

    function externalConvertTokenToWei(uint256 tokenAmount)
        external
        view
        returns (uint256)
    {
        return _convertTokenToWei(tokenAmount);
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

    function setEscrowForLoan(uint256 loanID, address escrowAddress) external {
        loans[loanID].escrow = escrowAddress;
    }

    function mockGetCollateralInfo(uint256 loanID, uint256 neededInLending, uint256 neededInCollateral) external {
        mockCollateralInfo[loanID].collateral = loans[loanID].collateral;
        mockCollateralInfo[loanID].neededInLendingTokens = neededInLending;
        mockCollateralInfo[loanID].neededInCollateralTokens = neededInCollateral;
        mockCollateralInfo[loanID].moreCollateralRequired = neededInCollateral > loans[loanID].collateral;
    }

    function _getCollateralInfo(uint256 loanID) internal view returns (TellerCommon.LoanCollateralInfo memory info) {
        info = mockCollateralInfo[loanID];
        if (info.collateral == 0) {
            info = super._getCollateralInfo(loanID);
        }
    }

    function initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address 
    ) external isNotInitialized() {
        _initialize(
            priceOracleAddress,
            lendingPoolAddress,
            loanTermsConsensusAddress,
            settingsAddress
        );
    }

    function depositCollateral(address borrower, uint256 loanID, uint256 amount)
        external
        payable
    {}

    function createLoanWithTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    ) external payable {}
}
