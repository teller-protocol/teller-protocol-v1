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

import "../../base/InterestConsensus.sol";

contract InterestConsensusMock is InterestConsensus {

    constructor(
        uint256 initRequiredSubmissions,
        uint256 initMaximumTolerance
    ) public InterestConsensus(
      initRequiredSubmissions,
      initMaximumTolerance
    ){}

    function mockNodeSubmissions(
        address lender,
        uint256 blockNumber,
        uint256 totalSubmissions,
        uint256 maxValue,
        uint256 minValue,
        uint256 sumOfValues,
        bool finalized
    ) external {
        nodeSubmissions[lender][blockNumber] = ZeroCollateralCommon.AggregatedInterest({
            totalSubmissions: totalSubmissions,
            minValue: minValue,
            maxValue: maxValue,
            sumOfValues: sumOfValues,
            finalized: finalized
        });
    }

    function mockHasSubmitted(
        address signer,
        address lender,
        uint256 blockNumber,
        bool hasSub
    ) external {
        hasSubmitted[signer][lender][blockNumber] = hasSub;
    }

    function externalHashData(
        address lender,
        uint256 blockNumber,
        uint256 interest,
        uint256 signerNonce
    ) external pure returns (bytes32) {
        return _hashData(lender, blockNumber, interest, signerNonce);
    }

}