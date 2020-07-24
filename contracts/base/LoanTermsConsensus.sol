pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./Consensus.sol";

// Interfaces
import "../interfaces/LoanTermsConsensusInterface.sol";


/**
    @notice This contract is used to process the loan requests through the Teller protocol

    @author develop@teller.finance
 */
contract LoanTermsConsensus is Consensus, LoanTermsConsensusInterface {
    /* Mappings */
    mapping(address => mapping(uint256 => ZeroCollateralCommon.AccruedLoanTerms)) public termSubmissions;
    mapping(address => mapping(uint256 => bool)) public requestNonceTaken;

    /**
        @notice Processes the loan request
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @return uint256 Interest rate
        @return uint256 Collateral ratio
        @return uint256 Maximum loan amount
     */
    function processRequest(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses
    )
        external
        isInitialized()
        isCaller()
        returns (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount)
    {
        require(
            responses.length >= settings.requiredSubmissions(),
            "INSUFFICIENT_RESPONSES"
        );
        require(
            !requestNonceTaken[request.borrower][request.requestNonce],
            "REQUEST_NONCE_TAKEN"
        );
        requestNonceTaken[request.borrower][request.requestNonce] = true;

        bytes32 requestHash = _hashRequest(request);

        for (uint256 i = 0; i < responses.length; i++) {
            _processResponse(request, responses[i], requestHash);
        }

        interestRate = _getConsensus(
            termSubmissions[request.borrower][request.requestNonce].interestRate
        );
        collateralRatio = _getConsensus(
            termSubmissions[request.borrower][request.requestNonce].collateralRatio
        );
        maxLoanAmount = _getConsensus(
            termSubmissions[request.borrower][request.requestNonce].maxLoanAmount
        );

        emit TermsAccepted(
            request.borrower,
            request.requestNonce,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );
    }

    /**
        @notice Processes the loan response
        @param request Struct of the protocol loan request
        @param response List of structs of the protocol loan responses
        @param requestHash bytes32 Hash of the loan request
     */
    function _processResponse(
        ZeroCollateralCommon.LoanRequest memory request,
        ZeroCollateralCommon.LoanResponse memory response,
        bytes32 requestHash
    ) internal {
        bytes32 responseHash = _hashResponse(response, requestHash);

        _validateResponse(
            response.signer,
            request.borrower,
            request.requestNonce,
            response.responseTime,
            responseHash,
            response.signature
        );

        termSubmissions[request.borrower][request.requestNonce].interestRate.addValue(
            response.interestRate
        );
        termSubmissions[request.borrower][request.requestNonce].collateralRatio.addValue(
            response.collateralRatio
        );
        termSubmissions[request.borrower][request.requestNonce].maxLoanAmount.addValue(
            response.maxLoanAmount
        );

        emit TermsSubmitted(
            response.signer,
            request.borrower,
            request.requestNonce,
            response.interestRate,
            response.collateralRatio,
            response.maxLoanAmount
        );
    }

    /**
        @notice Generates a hash for the loan response
        @param response Structs of the protocol loan responses
        @param requestHash Hash of the loan request
        @return bytes32 Hash of the loan response
     */
    function _hashResponse(
        ZeroCollateralCommon.LoanResponse memory response,
        bytes32 requestHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    response.signature.signerNonce,
                    _getChainId(),
                    requestHash
                )
            );
    }

    /**
        @notice Generates a hash for the loan request
        @param request Struct of the protocol loan request
        @return bytes32 Hash of the loan request
     */
    function _hashRequest(ZeroCollateralCommon.LoanRequest memory request)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    callerAddress,
                    request.borrower,
                    request.recipient,
                    request.consensusAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime,
                    _getChainId()
                )
            );
    }
}
