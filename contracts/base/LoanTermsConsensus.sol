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
import "../util/ZeroCollateralCommon.sol";
import "../util/NumbersList.sol";
import "../util/AddressLib.sol";

// Interfaces
import "../interfaces/LoansInterface.sol";
import "../interfaces/LoanTermsConsensusInterface.sol";

// Contracts
import "./Initializable.sol";
import "./Consensus.sol";


contract LoanTermsConsensus is Initializable, Consensus, LoanTermsConsensusInterface {
    using AddressLib for address;
    using SafeMath for uint256;
    using NumbersList for NumbersList.Values;

    LoansInterface public loans;

    // mapping of (borrower, requested loan id) to the aggregated node submissions for their request
    mapping(address => mapping(uint256 => ZeroCollateralCommon.AggregatedLoanTerms)) public nodeSubmissions;

    constructor(uint256 initRequiredSubmissions, uint256 initMaximumTolerance)
        public
        Consensus(initRequiredSubmissions, initMaximumTolerance)
    {}

    function initialize(address loansAddress) public isNotInitialized() {
        loansAddress.requireNotEmpty("MUST_PROVIDE_LOANS");

        initialize();

        loans = LoansInterface(loansAddress);
    }

    /** External Functions */

    function submitLoanTermsResult(
        ZeroCollateralCommon.Signature calldata signature,
        address borrower,
        uint256 requestedLoanId,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) external onlySigner() isInitialized() {
        require(
            !hasSubmitted[msg.sender][borrower][requestedLoanId],
            "SIGNER_ALREADY_SUBMITTED"
        );
        hasSubmitted[msg.sender][borrower][requestedLoanId] = true;

        // Verify signer nonce
        _processSignerNonce(msg.sender, signature.signerNonce);

        require(
            loans.requestedLoans(requestedLoanId).status ==
                ZeroCollateralCommon.RequestedLoanStatus.Processing,
            "LOAN_NOT_REQUESTED"
        );

        require(
            !nodeSubmissions[borrower][requestedLoanId].interestRates.isFinalized(
                requiredSubmissions
            ),
            "LOAN_TERMS_ALREADY_FINALIZED"
        );

        bytes32 hashedData = _hashData(
            borrower,
            requestedLoanId,
            interestRate,
            collateralRatio,
            maxLoanAmount,
            signature.signerNonce
        );
        require(_signatureValid(signature, hashedData), "SIGNATURE_NOT_VALID");


            ZeroCollateralCommon.AggregatedLoanTerms storage aggregatedData
         = nodeSubmissions[borrower][requestedLoanId];

        aggregatedData.interestRates.addValue(interestRate);
        aggregatedData.collateralRatios.addValue(collateralRatio);
        aggregatedData.maxLoanAmounts.addValue(maxLoanAmount);

        emit LoanTermsSubmitted(
            msg.sender,
            borrower,
            requestedLoanId,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );

        if (aggregatedData.interestRates.isFinalized(requiredSubmissions)) {
            require(
                !aggregatedData.interestRates.isWithinTolerance(maximumTolerance),
                "INTEREST_MAX_TOL_EXCEEDED"
            );
            require(
                !aggregatedData.collateralRatios.isWithinTolerance(maximumTolerance),
                "COLLATERAL_MAX_TOL_EXCEEDED"
            );
            require(
                !aggregatedData.maxLoanAmounts.isWithinTolerance(maximumTolerance),
                "AMOUNT_MAX_TOL_EXCEEDED"
            );

            uint256 interestRateAverage = aggregatedData.interestRates.getAverage();
            uint256 collateralRatioAverage = aggregatedData.collateralRatios.getAverage();
            uint256 maxLoanAmountAverage = aggregatedData.maxLoanAmounts.getAverage();

            loans.setLoanTerms(
                borrower,
                requestedLoanId,
                interestRateAverage,
                collateralRatioAverage,
                maxLoanAmountAverage
            );

            emit LoanTermsAccepted(
                borrower,
                requestedLoanId,
                interestRateAverage,
                collateralRatioAverage,
                maxLoanAmountAverage
            );
        }

        nodeSubmissions[borrower][requestedLoanId] = aggregatedData;
    }

    /** Internal Functions */

    function _hashData(
        address borrower,
        uint256 requestedLoanId,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount,
        uint256 signerNonce
    ) internal view returns (bytes32) {
        return
            keccak256(
                abi.encode(
                    address(this),
                    borrower,
                    requestedLoanId,
                    interestRate,
                    collateralRatio,
                    maxLoanAmount,
                    signerNonce
                )
            );
    }
}
