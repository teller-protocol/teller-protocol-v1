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

// Libraries
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// Interfaces
import "../interfaces/LenderInfoInterface.sol";

// Contracts
import "./Initializable.sol";
import "openzeppelin-solidity/contracts/access/roles/SignerRole.sol";

contract InterestConsensus is Initializable, SignerRole {
    using SafeMath for uint256;

    LenderInfoInterface public lenderInfo;

    // mapping of (signer, lender, blockNumber) to bool.
    // Has signer already submitted their answer for request (lender, blockNumber)?
    mapping(address => mapping(address => mapping(uint256 => bool))) hasSubmitted;

    // mapping of (lender, blockNumber) to the aggregated node submissions for their request
    mapping(address => mapping(uint256 => ZeroCollateralCommon.AggregatedInterest)) nodeSubmissions;

    mapping(address => mapping(uint256 => bool)) signerNonceTaken;

    event InterestSubmitted(address signer, address lender, uint256 blockNumber, uint256 interest);

    event InterestAccepted(address lender, uint256 blockNumber, uint256 interest);

    uint256 public requiredSubmissions;
    uint256 public maximumTolerance;

    constructor(
        uint256 initRequiredSubmissions,
        uint256 initMaximumTolerance
    ) public {
        require(initRequiredSubmissions > 0, 'VALUE_MUST_BE_PROVIDED');
        requiredSubmissions = initRequiredSubmissions;
        maximumTolerance = initMaximumTolerance;
    }

    function initialize(address lenderInfoAddress) public isNotInitialized() {
        require(lenderInfoAddress != address(0), 'MUST_PROVIDE_LENDER_INFO');

        lenderInfo = LenderInfoInterface(lenderInfoAddress);

        initialize();
    }

    function submitInterestResult(
        ZeroCollateralCommon.Signature signature,
        address lender,
        uint256 blockNumber,
        uint256 interest
    ) external onlySigner() {
        require(!hasSubmitted[msg.sender][lender][blockNumber], 'SIGNER_ALREADY_SUBMITTED');
        hasSubmitted[msg.sender][lender][blockNumber] = true;

        require(lenderInfo.requestedUpdate(lender) == blockNumber, 'INTEREST_NOT_REQUESTED');

        require(_signatureValid(signature, lender, blockNumber, interest), 'SIGNATURE_NOT_VALID');

        require(!nodeSubmissions[lender][blockNumber].finalised, 'INTEREST_ALREADY_FINALISED');

        // if this is the first submission for this request
        if (nodeSubmissions[lender][blockNumber].totalSubmissions == 0) {
            nodeSubmissions[lender][blockNumber] = ZeroCollateralCommon.AggregatedInterest({
                totalSubmissions: 1,
                minValue: interest,
                maxValue: interest,
                sumOfValues: interest
            })
        } else {
            if (interest < nodeSubmissions[lender][blockNumber].minValue) {
                nodeSubmissions[lender][blockNumber].minValue = interest;
            }
            if (interest > nodeSubmissions[lender][blockNumber].maxValue) {
                nodeSubmissions[lender][blockNumber].maxValue = interest;
            }

            nodeSubmissions[lender][blockNumber].sumOfValues = nodeSubmissions[lender][blockNumber]
                .sumOfValues
                .add(interest);
            nodeSubmissions[lender][blockNumber].totalSubmissions++;
        }

        emit InterestSubmitted(msg.sender, lender, blockNumber, interest);

        if (nodeSubmissions[lender][blockNumber].totalSubmissions > requiredSubmissions) {
            nodeSubmissions[lender][blockNumber].finalised = true;

            require(_resultsWithinTolerance(lender, blockNumber), 'MAXIMUM_TOLERANCE_SURPASSED');
            
            // average the submissions
            uint256 finalInterest = nodeSubmissions[lender][blockNumber]
                .sumOfValues
                .div(nodeSubmissions[lender][blockNumber].totalSubmissions)
            
            lenderInfo.setAccruedInterest(lender, blockNumber, finalInterest);

            emit InterestAccepted(lender, blockNumber, finalInterest);
        }
    }

    function _resultsWithinTolerance(
      address lender,
      uint256 blockNumber
    ) internal returns (bool) {
        
    }

    function _signatureValid(
        ZeroCollateralCommon.Signature signature,
        address lender,
        uint256 blockNumber,
        uint256 interest
    ) internal returns (bool) {

    }

}