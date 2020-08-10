pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/LoansBase.sol";


contract LoansBaseMock is LoansBase {
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

    function initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress
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
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    ) external payable {}
}
