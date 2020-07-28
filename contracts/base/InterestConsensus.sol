pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../util/AddressLib.sol";
import "../util/SignatureLib.sol";

// Interfaces
import "../interfaces/InterestConsensusInterface.sol";

// Contracts
import "./Consensus.sol";


/**
    @notice This contract processes the node responses to get consensus in the lender interest.

    @author develop@teller.finance
 */
contract InterestConsensus is Consensus, InterestConsensusInterface {
    using AddressLib for address;
    using SignatureLib for SignatureLib;

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
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external isInitialized() isCaller() returns (uint256) {
        require(
            responses.length >= settings.requiredSubmissions(),
            "INSUFFICIENT_RESPONSES"
        );

        bytes32 requestHash = SignatureLib.hashInterestRequest(request, callerAddress, _getChainId());

        for (uint256 i = 0; i < responses.length; i++) {
            _processResponse(request, responses[i], requestHash);
        }

        uint256 interestAccrued = _getConsensus(
            interestSubmissions[request.lender][request.endTime]
        );

        emit InterestAccepted(request.lender, request.endTime, interestAccrued);

        return interestAccrued;
    }

    /** Internal Functions */

    /**
        @notice It processes a node response.
        @param request the interest request sent by the lender.
        @param response a node response.
     */
    function _processResponse(
        ZeroCollateralCommon.InterestRequest memory request,
        ZeroCollateralCommon.InterestResponse memory response,
        bytes32 requestHash
    ) internal {
        bytes32 responseHash = SignatureLib.hashInterestResponse(response, requestHash, _getChainId());

        _validateResponse(
            response.signer,
            request.lender,
            request.endTime,
            response.responseTime,
            responseHash,
            response.signature
        );

        interestSubmissions[request.lender][request.endTime].addValue(response.interest);

        emit InterestSubmitted(
            response.signer,
            request.lender,
            request.endTime,
            response.interest
        );
    }
}
