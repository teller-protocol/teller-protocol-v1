pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./Consensus.sol";

// Interfaces
import "../interfaces/ILoanTermsConsensus.sol";

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
contract LoanTermsConsensus is ILoanTermsConsensus, Consensus {
    /* Mappings */
    /**
        @notice It identifies the loan terms submissions for a given borrower address and a request nonce.

        @dev Examples:
            @address(0x123...567) => 1 => AccruedLoanTerms({...})
            @address(0x123...567) => 2 => AccruedLoanTerms({...})
            @address(0x234...678) => 1 => AccruedLoanTerms({...})
     */
    mapping(address => mapping(uint256 => TellerCommon.AccruedLoanTerms))
        public termSubmissions;

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
        isInitialized()
        isCaller(msg.sender)
        returns (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        require(
            responses.length >=
                _getSettings().getPlatformSettingValue(
                    _getSettings().consts().REQUIRED_SUBMISSIONS_SETTING()
                ),
            "LOANTERM_INSUFFICIENT_RESPONSES"
        );
        _requireRequestLoanTermsRateLimit(request);
        require(
            !requestNonceTaken[request.borrower][request.requestNonce],
            "LOAN_TERMS_REQUEST_NONCE_TAKEN"
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
        borrowerToLastLoanTermRequest[request.borrower] = now;

        // TODO: Remove redundant event
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
        TellerCommon.LoanRequest memory request,
        TellerCommon.LoanResponse memory response,
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
            response.signature.signerNonce,
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
    function _hashResponse(TellerCommon.LoanResponse memory response, bytes32 requestHash)
        internal
        view
        returns (bytes32)
    {
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
    function _requireRequestLoanTermsRateLimit(TellerCommon.LoanRequest memory request)
        internal
        view
    {
        // In case it is the first time that borrower requests loan terms, we don't validate the rate limit.
        if (borrowerToLastLoanTermRequest[request.borrower] == 0) {
            return;
        }
        uint256 requestLoanTermsRateLimit = _getSettings().getPlatformSettingValue(
            _getSettings().consts().REQUEST_LOAN_TERMS_RATE_LIMIT_SETTING()
        );
        require(
            borrowerToLastLoanTermRequest[request.borrower].add(
                requestLoanTermsRateLimit
            ) <= now,
            "REQS_LOAN_TERMS_LMT_EXCEEDS_MAX"
        );
    }
}
