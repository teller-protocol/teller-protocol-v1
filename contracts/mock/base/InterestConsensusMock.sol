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

    function mockInterestSubmissions(
        address lender,
        uint256 blockNumber,
        uint256 totalSubmissions,
        uint256 maxValue,
        uint256 minValue,
        uint256 sumOfValues
    ) external {
        interestSubmissions[lender][blockNumber] = NumbersList.Values({
            length: totalSubmissions,
            min: minValue,
            max: maxValue,
            sum: sumOfValues
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

    function mockSignerNonce(
        address signer,
        uint256 signerNonce,
        bool taken
    ) external {
        signerNonceTaken[signer][signerNonce] = taken;
    }

    function externalProcessResponse(
        ZeroCollateralCommon.InterestRequest calldata request,
        ZeroCollateralCommon.InterestResponse calldata response,
        bytes32 requestHash
    ) external {
        _processReponse(request, response, requestHash);
    }

    function externalHashResponse(
        ZeroCollateralCommon.InterestResponse calldata response,
        bytes32 requestHash
    ) external pure {
        _hashResponse(response, requestHash);
    }

    function externalHashRequest(
        ZeroCollateralCommon.InterestRequest calldata request
    ) external view {
        _hashRequest(request);
    }

}