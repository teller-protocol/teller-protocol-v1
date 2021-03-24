pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./Consensus.sol";

// Interfaces
import "../interfaces/LoanTermsConsensusInterface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to process the loan requests through the Teller protocol

    @author develop@teller.finance
 */
contract LoanTermsConsensus is LoanTermsConsensusInterface, Consensus {
    /* Mappings */

    /**
        This mapping identify the last request timestamp for a given borrower address.

            Example:    address(0x123...789) = timestamp(now)

        It is used as rate limit per borrower address.
     */
    mapping(address => uint256) public borrowerToLastLoanTermRequest;

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
        isCaller(msg.sender)
        onlyEnoughSubmissions(responses.length)
        returns (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        _requireRequestLoanTermsRateLimit(request);
        require(
            !requestNonceTaken[request.borrower][request.requestNonce],
            "LOAN_TERMS_REQUEST_NONCE_TAKEN"
        );
        requestNonceTaken[request.borrower][request.requestNonce] = true;

        bytes32 requestHash = _hashRequest(request);

        TellerCommon.AccruedLoanTerms memory termSubmissions;
        for (uint256 i = 0; i < responses.length; i++) {
            _processResponse(
                request,
                responses[i],
                termSubmissions,
                requestHash
            );
        }

        uint256 tolerance = settings.getMaximumToleranceValue();
        interestRate = _getConsensus(termSubmissions.interestRate, tolerance);
        collateralRatio = _getConsensus(
            termSubmissions.collateralRatio,
            tolerance
        );
        maxLoanAmount = _getConsensus(termSubmissions.maxLoanAmount, tolerance);
        borrowerToLastLoanTermRequest[request.borrower] = now;
    }

    /**
        @notice Processes the loan response
        @param request Struct of the protocol loan request
        @param response List of structs of the protocol loan responses
        @param requestHash bytes32 Hash of the loan request
     */
    function _processResponse(
        TellerCommon.LoanRequest memory request,
        TellerCommon.LoanResponse memory response,
        TellerCommon.AccruedLoanTerms memory termSubmissions,
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

        termSubmissions.interestRate.addValue(response.interestRate);
        termSubmissions.collateralRatio.addValue(response.collateralRatio);
        termSubmissions.maxLoanAmount.addValue(response.maxLoanAmount);
    }

    /**
        @notice Generates a hash for the loan response
        @param response Structs of the protocol loan responses
        @param requestHash Hash of the loan request
        @return bytes32 Hash of the loan response
     */
    function _hashResponse(
        TellerCommon.LoanResponse memory response,
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
    function _hashRequest(TellerCommon.LoanRequest memory request)
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

    /**
        @notice It validates whether the time window between the last loan terms request and current one exceeds the maximum rate limit.
        @param request the new request.
        @dev It throws a require error if the request rate limit exceeds the maximum.
     */
    function _requireRequestLoanTermsRateLimit(
        TellerCommon.LoanRequest memory request
    ) internal view {
        // In case it is the first time that borrower requests loan terms, we don't validate the rate limit.
        if (borrowerToLastLoanTermRequest[request.borrower] == 0) {
            return;
        }
        uint256 requestLoanTermsRateLimit =
            settings.getRequestLoanTermsRateLimitValue();
        require(
            borrowerToLastLoanTermRequest[request.borrower].add(
                requestLoanTermsRateLimit
            ) <= now,
            "REQS_LOAN_TERMS_LMT_EXCEEDS_MAX"
        );
    }
}
