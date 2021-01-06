pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice This interface defines the function to process the loan terms through the Teller protocol

    @author develop@teller.finance
 */
interface ILoanTermsConsensus {
    /**
        @notice This event is emitted when the loan terms have been submitted
        @param signer Account address of the signatory
        @param borrower Account address of the borrowing party
        @param requestNonce Nonce used for authentication of the loan request
        @param interestRate Interest rate submitted in the loan request
        @param collateralRatio Ratio of collateral submitted for the loan
        @param maxLoanAmount Maximum loan amount that can be taken out
     */
    event TermsSubmitted(
        address indexed signer,
        address indexed borrower,
        uint256 indexed requestNonce,
        uint256 signerNonce,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    /**
        @notice This event is emitted when the loan terms have been accepted
        @param borrower Account address of the borrowing party
        @param requestNonce Accepted interest rate for the loan
        @param collateralRatio Ratio of collateral needed for the loan
        @param maxLoanAmount Maximum loan amount that the borrower can take out
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
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @return uint256 Interest rate
        @return uint256 Collateral ratio
        @return uint256 Maximum loan amount
     */
    function processRequest(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses
    )
        external
        returns (
            uint256,
            uint256,
            uint256
        );

    /**
        @notice It initializes this loan terms consensus contract.
        @dev The caller address is the loans address for the loan terms consensus implementation.
        @param owner the owner address.
        @param aCallerAddress the contract that will call it.
        @param aSettingAddress the settings contract address.
     */
    function initialize(
        address owner,
        address aCallerAddress,
        address aSettingAddress
    ) external;
}
