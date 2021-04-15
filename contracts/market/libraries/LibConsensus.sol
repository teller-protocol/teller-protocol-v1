// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AppStorageLib } from "../../storage/app.sol";
import {
    MarketStorageLib,
    MarketStorage,
    LoanRequest,
    LoanResponse,
    AccruedLoanTerms,
    Signature
} from "../../storage/market.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import { NumbersList } from "../../shared/libraries/NumbersList.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/PlatformSettingsLib.sol";
import { ECDSA } from "./ECDSALib.sol";
import { RolesLib } from "../../contexts2/access-control/roles/RolesLib.sol";
import { SIGNER } from "../../shared/roles.sol";

library LibConsensus {
    using NumbersLib for uint256;
    using NumbersList for NumbersList.Values;

    function s() private pure returns (MarketStorage storage) {
        return MarketStorageLib.store();
    }

    function processLoanTerms(
        LoanRequest calldata request,
        LoanResponse[] calldata responses
    )
        external
        view
        returns (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        require(
            responses.length.ratioOf(s().signers.array.length) >=
                PlatformSettingsLib.getRequiredSubmissionsPercentageValue(),
            "Teller: insufficient signer responses"
        );

        _validateLoanRequest(request.borrower, request.requestNonce);

        uint256 chainId = _getChainId();
        bytes32 requestHash = _hashRequest(request, chainId);

        AccruedLoanTerms memory termSubmissions;

        for (uint256 i = 0; i < responses.length; i++) {
            LoanResponse memory response = responses[i];

            require(
                RolesLib.hasRole(SIGNER, response.signer),
                "Teller: invalid signer"
            );
            require(
                response.assetAddress == request.assetAddress,
                "Teller: consensus address mismatch"
            );
            require(
                response.responseTime >=
                    block.timestamp -
                        PlatformSettingsLib.getTermsExpiryTimeValue(),
                "Teller: consensus response expired"
            );
            require(
                _signatureValid(
                    response.signature,
                    _hashResponse(response, requestHash, chainId),
                    response.signer
                ),
                "Teller: response signature invalid"
            );

            // TODO: use a local AddressArrayLib instead to save gas
            for (uint8 j = 0; j < i; j++) {
                require(
                    response.signer != responses[j].signer,
                    "Teller: dup signer response"
                );
            }

            termSubmissions.interestRate.addValue(response.interestRate);
            termSubmissions.collateralRatio.addValue(response.collateralRatio);
            termSubmissions.maxLoanAmount.addValue(response.maxLoanAmount);
        }

        uint256 tolerance = PlatformSettingsLib.getMaximumToleranceValue();
        interestRate = _getConsensus(termSubmissions.interestRate, tolerance);
        collateralRatio = _getConsensus(
            termSubmissions.collateralRatio,
            tolerance
        );
        maxLoanAmount = _getConsensus(termSubmissions.maxLoanAmount, tolerance);
    }

    /**
     * @dev Checks if the nonce provided in the request is equal to the borrower's number of loans.
     * @dev Also verifies if the borrower has taken out a loan recently (rate limit).
     * @param borrower the borrower's address.
     * @param nonce the nonce included in the loan request.
     */
    function _validateLoanRequest(address borrower, uint256 nonce)
        private
        view
    {
        uint256[] storage borrowerLoans = s().borrowerLoans[borrower];
        uint256 numberOfLoans = borrowerLoans.length;

        require(nonce == numberOfLoans, "Teller: bad request nonce");

        // In case it is the first time that borrower requests loan terms, we don't
        // validate the rate limit.
        if (numberOfLoans == 0) {
            return;
        }

        uint256 loanStartTime =
            s().loans[borrowerLoans[numberOfLoans - 1]].loanStartTime;
        require(
            loanStartTime +
                PlatformSettingsLib.getRequestLoanTermsRateLimitValue() <=
                block.timestamp,
            "Teller: loan terms rate limit reached"
        );
    }

    /**
     * @notice Gets the current chain id using the opcode 'chainid()'.
     * @return the current chain id.
     */
    function _getChainId() private view returns (uint256) {
        // silence state mutability warning without generating bytecode.
        // see https://github.com/ethereum/solidity/issues/2691
        uint256 id;
        assembly {
            id := chainid()
        }
        return id;
    }

    /**
     * @notice Generates a hash for the loan request
     * @param request Struct of the protocol loan request
     * @return bytes32 Hash of the loan request
     */
    function _hashRequest(LoanRequest memory request, uint256 chainId)
        private
        pure
        returns (bytes32)
    {
        return
            keccak256(
                abi.encode(
                    request.borrower,
                    request.recipient,
                    request.assetAddress,
                    request.requestNonce,
                    request.amount,
                    request.duration,
                    request.requestTime,
                    chainId
                )
            );
    }

    /**
     * @notice Generates a hash for the loan response
     * @param response Structs of the protocol loan responses
     * @param requestHash Hash of the loan request
     * @return bytes32 Hash of the loan response
     */
    function _hashResponse(
        LoanResponse memory response,
        bytes32 requestHash,
        uint256 chainId
    ) internal pure returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    response.assetAddress,
                    response.responseTime,
                    response.interestRate,
                    response.collateralRatio,
                    response.maxLoanAmount,
                    chainId,
                    requestHash
                )
            );
    }

    /**
     * @notice It validates whether a signature is valid or not.
     * @param signature signature to validate.
     * @param dataHash used to recover the signer.
     * @param expectedSigner the expected signer address.
     * @return true if the expected signer is equal to the signer. Otherwise it returns false.
     */
    function _signatureValid(
        Signature memory signature,
        bytes32 dataHash,
        address expectedSigner
    ) internal pure returns (bool) {
        return
            expectedSigner ==
            ECDSA.recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        dataHash
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
    }

    /**
     * @notice Gets the consensus value for a list of values (uint values).
     * @notice The values must be in a maximum tolerance range.
     * @return the consensus value.
     */
    function _getConsensus(NumbersList.Values memory values, uint256 tolerance)
        internal
        pure
        returns (uint256)
    {
        require(
            values.isWithinTolerance(tolerance),
            "Teller: consensus response values too varied"
        );

        return values.getAverage();
    }
}
