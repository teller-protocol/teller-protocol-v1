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

// Contracts
import "./Consensus.sol";

// Interfaces
import "../interfaces/LoanTermsConsensusInterface.sol";


contract LoanTermsConsensus is Consensus, LoanTermsConsensusInterface {
    mapping(address => mapping(uint256 => ZeroCollateralCommon.AccruedLoanTerms)) public termSubmissions;
    mapping(address => mapping(uint256 => bool)) public requestNonceTaken;

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

    function _hashResponse(
        ZeroCollateralCommon.LoanResponse memory response,
        bytes32 requestHash
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.consensusAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    response.signature.signerNonce,
                    requestHash
                )
            );
    }

    function _hashRequest(ZeroCollateralCommon.LoanRequest memory request)
        internal
        view
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    caller,
                    request.borrower,
                    request.recipient,
                    request.consensusAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime
                )
            );
    }
}
