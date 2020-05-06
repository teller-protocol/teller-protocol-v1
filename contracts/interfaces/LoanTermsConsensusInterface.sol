pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";


interface LoanTermsConsensusInterface {
    event TermsSubmitted(
        address indexed signer,
        address indexed borrower,
        uint256 indexed requestNonce,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    event TermsAccepted(
        address indexed borrower,
        uint256 indexed requestNonce,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    function processRequest(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses
    ) external returns (uint256, uint256, uint256);
}
