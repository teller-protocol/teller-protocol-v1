pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries

// Interfaces
import "../interfaces/IInterestConsensus.sol";

// Contracts
import "./Consensus.sol";

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
    @notice This contract processes the node responses to get consensus in the lender interest.

    @author develop@teller.finance
 */
contract InterestConsensus is IInterestConsensus, Consensus {
    /* State Variables */

    // mapping of (lender, endTime) to the aggregated node submissions for their request
    mapping(address => mapping(uint256 => NumbersList.Values)) public interestSubmissions;

    /** Modifiers */

    /* Constructor */

    /* External Functions */
    /**
        @notice It processes all the node responses for a request in order to get a consensus value.
        @param request the interest request sent by the lender.
        @param responses all node responses to process.
        @return the consensus interest.
     */
    function processRequest(
        TellerCommon.InterestRequest calldata request,
        TellerCommon.InterestResponse[] calldata responses
    ) external isInitialized() isCaller(msg.sender) returns (uint256) {
        require(
            responses.length >=
                _getSettings().getPlatformSettingValue(
                    _getSettings().consts().REQUIRED_SUBMISSIONS_SETTING()
                ),
            "INTEREST_INSUFFICIENT_RESPONSES"
        );
        require(
            !requestNonceTaken[request.lender][request.requestNonce],
            "INTEREST_REQUEST_NONCE_TAKEN"
        );
        requestNonceTaken[request.lender][request.requestNonce] = true;

        bytes32 requestHash = _hashRequest(request);

        for (uint256 i = 0; i < responses.length; i++) {
            _processResponse(request, responses[i], requestHash);
        }

        uint256 interestAccrued = _getConsensus(
            interestSubmissions[request.lender][request.endTime]
        );

        emit InterestAccepted(
            request.lender,
            request.requestNonce,
            request.endTime,
            interestAccrued
        );

        return interestAccrued;
    }

    /** Internal Functions */

    /**
        @notice It processes a node response.
        @param request the interest request sent by the lender.
        @param response a node response.
     */
    function _processResponse(
        TellerCommon.InterestRequest memory request,
        TellerCommon.InterestResponse memory response,
        bytes32 requestHash
    ) internal {
        bytes32 responseHash = _hashResponse(response, requestHash);

        _validateResponse(
            response.signer,
            request.lender,
            request.requestNonce,
            response.responseTime,
            responseHash,
            response.signature
        );

        interestSubmissions[request.lender][request.endTime].addValue(response.interest);

        emit InterestSubmitted(
            response.signer,
            request.lender,
            request.requestNonce,
            request.endTime,
            response.interest
        );
    }

    /**
        @notice It creates a hash based on a node response and lender request.
        @param response a node response.
        @param requestHash a hash value that represents the lender request.
        @return a hash value.
     */
    function _hashResponse(
        TellerCommon.InterestResponse memory response,
        bytes32 requestHash
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interest,
                    response.signature.signerNonce,
                    _getChainId(),
                    requestHash
                )
            );
    }

    /**
        @notice It creates a hash value based on the lender request.
        @param request the interest request sent by the lender.
        @return a hash value.
     */
    function _hashRequest(TellerCommon.InterestRequest memory request)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    callerAddress,
                    request.lender,
                    request.consensusAddress,
                    request.requestNonce,
                    request.startTime,
                    request.endTime,
                    request.requestTime,
                    _getChainId()
                )
            );
    }
}
