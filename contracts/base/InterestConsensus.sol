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
import "../util/AddressLib.sol";

// Interfaces
import "../interfaces/InterestConsensusInterface.sol";

// Contracts
import "./Consensus.sol";


contract InterestConsensus is Consensus, InterestConsensusInterface {
    using AddressLib for address;

    // mapping of (lender, endTime) to the aggregated node submissions for their request
    mapping(address => mapping(uint256 => NumbersList.Values)) public interestSubmissions;

    function processRequest(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse[] calldata responses
    ) external isInitialized() isCaller() returns (uint256) {
        require(
            responses.length >= settings.requiredSubmissions(),
            "INSUFFICIENT_RESPONSES"
        );

        bytes32 requestHash = _hashRequest(request);

        for (uint256 i = 0; i < responses.length; i++) {
            _processResponse(request, responses[i], requestHash);
        }

        uint256 interestAccrued = _getConsensus(
            interestSubmissions[request.lender][request.endTime]
        );

        emit InterestAccepted(request.lender, request.endTime, interestAccrued);

        return interestAccrued;
    }

    function _processResponse(
        ZeroCollateralCommon.InterestRequest memory request,
        ZeroCollateralCommon.InterestResponse memory response,
        bytes32 requestHash
    ) internal {
        bytes32 responseHash = _hashResponse(response, requestHash);

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
                    caller,
                    request.lender,
                    request.startTime,
                    request.endTime,
                    request.requestTime
                )
            );
    }
}
