pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";


interface LoanTermsConsensusInterface {
    event TermsSubmitted(
        address signer,
        address borrower,
        uint256 loanID,
        uint256 interest,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    event TermsAccepted(
        address borrower,
        uint256 loanID,
        uint256 interest,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    function processRequest(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses,
        uint256 loanID
    ) external returns (uint256, uint256, uint256);
}
