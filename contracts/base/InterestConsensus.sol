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

// Interfaces
import "../interfaces/LendersInterface.sol";

// Contracts
import "./Initializable.sol";
import "./Consensus.sol";

contract InterestConsensus is Initializable, Consensus {
    using SafeMath for uint256;

    LendersInterface public lenderInfo;

    // mapping of (lender, blockNumber) to the aggregated node submissions for their request
    mapping(address => mapping(uint256 => ZeroCollateralCommon.AggregatedInterest)) nodeSubmissions;

    event InterestSubmitted(address signer, address lender, uint256 blockNumber, uint256 interest);

    event InterestAccepted(address lender, uint256 blockNumber, uint256 interest);

    constructor(
        uint256 initRequiredSubmissions,
        uint256 initMaximumTolerance
    ) public Consensus(
      initRequiredSubmissions,
      initMaximumTolerance
    ){}

    function initialize(address lenderInfoAddress) public isNotInitialized() {
        require(lenderInfoAddress != address(0), 'MUST_PROVIDE_LENDER_INFO');

        lenderInfo = LendersInterface(lenderInfoAddress);

        initialize();
    }

    function submitInterestResult(
        ZeroCollateralCommon.Signature calldata signature,
        address lender,
        uint256 blockNumber,
        uint256 interest
    ) external onlySigner() isInitialized() {
        require(!hasSubmitted[msg.sender][lender][blockNumber], 'SIGNER_ALREADY_SUBMITTED');
        hasSubmitted[msg.sender][lender][blockNumber] = true;

        require(lenderInfo.requestedInterestUpdate(lender) == blockNumber, 'INTEREST_NOT_REQUESTED');

        require(!nodeSubmissions[lender][blockNumber].finalised, 'INTEREST_ALREADY_FINALISED');

        bytes32 hashedData = _hashData(lender, blockNumber, interest, signature.signerNonce);
        require(_signatureValid(signature, hashedData), 'SIGNATURE_NOT_VALID');

        ZeroCollateralCommon.AggregatedInterest memory aggregatedData = nodeSubmissions[lender][blockNumber];

        // if this is the first submission for this request
        if (aggregatedData.totalSubmissions == 0) {
            aggregatedData = ZeroCollateralCommon.AggregatedInterest({
                totalSubmissions: 1,
                minValue: interest,
                maxValue: interest,
                sumOfValues: interest,
                finalised: false
            });
        } else {
            if (interest < aggregatedData.minValue) {
                aggregatedData.minValue = interest;
            }
            if (interest > aggregatedData.maxValue) {
                aggregatedData.maxValue = interest;
            }

            aggregatedData.sumOfValues = aggregatedData.sumOfValues.add(interest);
            aggregatedData.totalSubmissions++;
        }

        emit InterestSubmitted(msg.sender, lender, blockNumber, interest);

        if (aggregatedData.totalSubmissions > requiredSubmissions) {
            aggregatedData.finalised = true;

            // average the submissions
            uint256 finalInterest = aggregatedData.sumOfValues.div(aggregatedData.totalSubmissions);

            require(
              _resultsWithinTolerance(aggregatedData.maxValue, aggregatedData.minValue, finalInterest),
              'MAXIMUM_TOLERANCE_SURPASSED'
            );

            lenderInfo.setAccruedInterest(lender, blockNumber, finalInterest);

            emit InterestAccepted(lender, blockNumber, finalInterest);
        }

        nodeSubmissions[lender][blockNumber] = aggregatedData;
    }

    function _hashData(
        address lender,
        uint256 blockNumber,
        uint256 interest,
        uint256 signerNonce
    ) internal pure returns (bytes32) {
        return keccak256(
            abi.encode(
                lender,
                blockNumber,
                interest,
                signerNonce
            )
        );
    }

}