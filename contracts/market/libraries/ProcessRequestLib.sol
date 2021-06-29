// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import {
    LoanRequest,
    DataProviderSignature,
    Signature
} from "../../storage/market.sol";
import { LibLoans } from "./LibLoans.sol";
import { MarketLib } from "./MarketLib.sol";
import { Verifier } from "../cra/verifier.sol";

library ProcessRequestLib {
    /**
     * @notice it uses our request to verify the returned proof and witness with each other,
     * verifies our signature data with our respective data providers, then retrieves our interest rate,
     * collateral ratio and max loan amount
     * @param request contains all the needed data to do the above
     * @return interestRate the rate of the loan
     * @return collateralRatio the collateral ratio required for the loan, if any
     * @return maxLoanAmount the max loan amount the user is entitled to
     */
    function processMarketRequest(LoanRequest memory request)
        internal
        returns (
            uint16 interestRate,
            uint16 collateralRatio,
            uint256 maxLoanAmount
        )
    {
        // Overwrite the first snark witness item with the on-chain identifier
        // for the loan (msg.sender ^ nonce). This forces the CRA to have been
        // run with the proper identifier.
        request.witness[0] =
            uint256(uint160(msg.sender)) ^
            LibLoans.s().borrowerLoans[msg.sender].length;

        // Verify the snark proof.
        require(
            Verifier.verifyTx(request.proof, request.witness),
            "Proof not verified"
        );
        // get variable amount of commitments from market handler
        bytes32[] memory commitments = new bytes32[](0);

        // constructing our commitments to verify with our signature data
        for (uint8 i = 0; i < commitments.length; i++) {
            for (uint8 j = 0; j < 8; j++) {
                commitments[i] =
                    (commitments[i] << 32) ^
                    bytes32(request.witness[2 + i * 8 + j]);
            }
            commitments[i] ^= bytes32(request.signatureData[i].signedAt);
        }

        // equate this require statement to amount of commitments from market handler
        require(request.signatureData.length == 3, "Must have 3 providers!");

        // Verify that the commitment signatures are valid and that the data
        // is not too old for the market's liking.
        _verifySignatures(commitments, request.signatureData);

        // The second witness item (after identifier) is the market
        // score
        uint256 marketScore = uint256(request.witness[1]);

        // Let the market handle the loan request and disperse the loan.

        // create default teller market handler
        // pass it the marketId and return max loan amount, collateral ratio, interest rate
        // upper and lower bound for loan amount, interest rate and collateral ratio depending on
        // market id
        (interestRate, collateralRatio, maxLoanAmount) = MarketLib.handler(
            marketScore,
            request
        );
        return (interestRate, collateralRatio, maxLoanAmount);
    }

    function _verifySignatures(
        bytes32[] memory commitments,
        DataProviderSignature[] memory signatureData
    ) private {
        for (uint256 i = 0; i < signatureData.length; i++) {
            bytes32 providerId = bytes32(i);
            require(
                signatureData[i].signedAt >
                    block.timestamp - MarketLib.p(providerId).maxAge,
                "Signed at less than max age"
            );
            require(
                MarketLib.s().usedCommitments[commitments[i]] == false,
                "Teller: commitment already used"
            );

            MarketLib.s().usedCommitments[commitments[i]] = true;

            _validateSignature(
                signatureData[i].signature,
                commitments[i],
                providerId
            );
        }
    }

    /**
     * @notice It validates whether a signature is valid or not.
     * @param signature signature to validate.
     * @param commitment used to recover the signer.
     * @param providerId the expected signer address.
     */
    function _validateSignature(
        Signature memory signature,
        bytes32 commitment,
        bytes32 providerId
    ) private view {
        address recoveredSigner =
            ECDSA.recover(
                keccak256(
                    abi.encodePacked(
                        "\x19Ethereum Signed Message:\n32",
                        uint256(commitment)
                    )
                ),
                signature.v,
                signature.r,
                signature.s
            );
        require(
            MarketLib.p(providerId).signer[recoveredSigner],
            "Teller: not valid signature"
        );
    }
}
