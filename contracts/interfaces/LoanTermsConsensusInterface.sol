pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";

/**
    @notice This interface defines the function to process the loan terms through the Teller protocol

    @author develop@teller.finance
 */
interface LoanTermsConsensusInterface {
    /**
        @notice This event is emitted when the loan terms have been submitted
        @param signer adddress Account address of the signatory
        @param borrower address Account address of the borrowing party
        @param requestNonce uint256 Nonce used for authentication of the loan request
        @param interestRate uint256 Interest rate submitted in the loan request
        @param collateralRatio uint256 Ratio of collateral submitted for the loan
        @param maxLoanAmount uint256 Maximum loan amount that can be taken out
     */
    event TermsSubmitted(
        address indexed signer,
        address indexed borrower,
        uint256 indexed requestNonce,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    /**
        @notice This event is emitted when the loan terms have been accepted
        @param borrower address Account address of the borrowing party
        @param requestNonce uint256 Accepted interest rate for the loan
        @param collateralRatio uint256 Ratio of collateral needed for the loan
        @param maxLoanAmount uint256 Maximum loan amount that the borrower can take out
     */
    event TermsAccepted(
        address indexed borrower,
        uint256 indexed requestNonce,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    /**
        @notice Processes the loan request
        @param ZeroCollateralCommon.LoanRequest request Struct of the protocol loan request
        @param ZeroCollateralCommon.LoanResponses request List of structs of the protocol loan responses
        @return uint256 Interest rate
        @return uint256 Collateral ratio
        @return uint256 Maximum loan amount
     */
    function processRequest(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses
    ) external returns (uint256, uint256, uint256);
}
