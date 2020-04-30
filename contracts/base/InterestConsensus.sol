/*
    Copyright 2020 Fabrx Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "../util/NumbersList.sol";
import "../util/AddressLib.sol";
import "../util/ZeroCollateralCommon.sol";

// Interfaces
import "../interfaces/InterestConsensusInterface.sol";

// Contracts
import "./Initializable.sol";
import "./Consensus.sol";


contract InterestConsensus is Consensus, Initializable, InterestConsensusInterface {
    using AddressLib for address;
    using SafeMath for uint256;
    using NumbersList for NumbersList.Values;

    address public lenders;

    uint256 responseExpiryLength;

    // mapping of (lender, endTime) to the aggregated node submissions for their request
    mapping(address => mapping(uint256 => NumbersList.Values)) public interestSubmissions;

    modifier isLenders() {
        require(lenders == msg.sender, "Address has no permissions.");
        _;
    }

    function initialize(
        address lendersAddress,
        uint256 initRequiredSubmissions,
        uint256 initMaximumTolerance,
        uint256 initResponseExpiry
    ) public isNotInitialized() {
        lendersAddress.requireNotEmpty("MUST_PROVIDE_LENDER_INFO");
        require(initRequiredSubmissions > 0, "MUST_PROVIDE_REQUIRED_SUBS");
        require(initResponseExpiry > 0, "MUST_PROVIDE_RESPONSE_EXP");

        _initialize();

        lenders = lendersAddress;
        requiredSubmissions = initRequiredSubmissions;
        maximumTolerance = initMaximumTolerance;
        responseExpiryLength = initResponseExpiry;
    }

    function processRequest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external isInitialized() isLenders() returns (uint256) {
        require(responses.length >= requiredSubmissions, "INSUFFICIENT_RESPONSES");

        bytes32 requestHash = _hashRequest(request);

        for (uint256 i = 0; i < responses.length; i++) {
            _processReponse(request, responses[i], requestHash);
        }

        require(
            interestSubmissions[request.lender][request.endTime].isWithinTolerance(
                maximumTolerance
            ),
            "RESPONSES_TOO_VARIED"
        );

        uint256 average = interestSubmissions[request.lender][request.endTime]
            .getAverage();

        emit InterestAccepted(request.lender, request.endTime, average);

        return average;
    }

    function _processReponse(
        ZeroCollateralCommon.InterestRequest memory request,
        ZeroCollateralCommon.InterestResponse memory response,
        bytes32 requestHash
    ) internal {
        require(
            !hasSubmitted[response.signer][request.lender][request.endTime],
            "SIGNER_ALREADY_SUBMITTED"
        );
        hasSubmitted[response.signer][request.lender][request.endTime] = true;

        require(
            !signerNonceTaken[response.signer][response.signature.signerNonce],
            "SIGNER_NONCE_TAKEN"
        );
        signerNonceTaken[response.signer][response.signature.signerNonce] = true;

        require(
            response.responseTime >= now.sub(responseExpiryLength),
            "RESPONSE_EXPIRED"
        );

        bytes32 responseHash = _hashResponse(response, requestHash);
        require(
            _signatureValid(response.signature, responseHash, response.signer),
            "SIGNATURE_INVALID"
        );

        interestSubmissions[request.lender][request.endTime].addValue(response.interest);

        emit InterestSubmitted(
            response.signer,
            request.lender,
            request.endTime,
            response.interest
        );
    }

    function _hashResponse(
        ZeroCollateralCommon.InterestResponse memory response,
        bytes32 requestHash
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.responseTime,
                    response.interest,
                    response.signature.signerNonce,
                    requestHash
                )
            );
    }

    function _hashRequest(ZeroCollateralCommon.InterestRequest memory request)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    lenders,
                    request.lender,
                    request.startTime,
                    request.endTime,
                    request.requestTime
                )
            );
    }
}
