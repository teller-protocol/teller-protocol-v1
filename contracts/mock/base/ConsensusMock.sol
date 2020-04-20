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

import "../../base/Consensus.sol";

contract ConsensusMock is Consensus {

    constructor(
        uint256 initRequiredSubmissions,
        uint256 initMaximumTolerance
    ) public Consensus(
      initRequiredSubmissions,
      initMaximumTolerance
    ){}

    function externalSignatureValid(
        ZeroCollateralCommon.Signature calldata signature,
        bytes32 dataHash
    ) external view returns (bool) {
        return _signatureValid(signature, dataHash);
    }

    function externalResultsWithinTolerance(
      uint256 maximum,
      uint256 minimum,
      uint256 average
    ) external view returns (bool) {
        return _resultsWithinTolerance(maximum, minimum, average);
    }

}