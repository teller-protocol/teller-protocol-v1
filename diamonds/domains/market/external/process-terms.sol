// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { int_get_sto_Loans } from "../internal/get-loans-storage.sol";

abstract contract ext_process_terms_v1 is int_get_sto_Loans {
    function processLoanTerms(
        TellerCommon.LoanRequest calldata request,
        TellerCommon.LoanResponse[] calldata responses
    )
        external
        view
        override
        onlyEnoughSubmissions(responses.length)
        returns (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        address borrower = request.borrower;

        _validateLoanRequest(borrower, request.requestNonce);

        require(
            request.consensusAddress == address(this),
            "BAD_CONSENSUS_ADDRESS"
        );

        uint256 chainId = _getChainId();

        bytes32 requestHash = _hashRequest(request, chainId);

        uint256 responseExpiryLengthValue =
            settings.getResponseExpiryLengthValue();

        TellerCommon.AccruedLoanTerms memory termSubmissions;

        for (uint256 i = 0; i < responses.length; i++) {
            TellerCommon.LoanResponse memory response = responses[i];

            require(_isSigner(response.signer), "NOT_SIGNER");

            require(
                response.consensusAddress == request.consensusAddress,
                "CONSENSUS_ADDRESS_MISMATCH"
            );

            for (uint8 j = 0; j < i; j++) {
                require(
                    response.signer != responses[j].signer,
                    "SIGNER_ALREADY_SUBMITTED"
                );
            }

            require(
                response.responseTime >=
                    block.timestamp.sub(responseExpiryLengthValue),
                "RESPONSE_EXPIRED"
            );

            bytes32 responseHash =
                _hashResponse(response, requestHash, chainId);

            require(
                _signatureValid(
                    response.signature,
                    responseHash,
                    response.signer
                ),
                "SIGNATURE_INVALID"
            );

            termSubmissions.interestRate.addValue(response.interestRate);
            termSubmissions.collateralRatio.addValue(response.collateralRatio);
            termSubmissions.maxLoanAmount.addValue(response.maxLoanAmount);
        }

        uint256 tolerance = settings.getMaximumToleranceValue();
        interestRate = _getConsensus(termSubmissions.interestRate, tolerance);
        collateralRatio = _getConsensus(
            termSubmissions.collateralRatio,
            tolerance
        );
        maxLoanAmount = _getConsensus(termSubmissions.maxLoanAmount, tolerance);
    }
}

abstract contract ext_process_terms is ext_process_terms_v1 {}
