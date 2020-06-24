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

import "./ChainlinkPairAggregator.sol";

contract InverseChainlinkPairAggregator is ChainlinkPairAggregator {

    constructor(address aggregatorAddress, uint8 responseDecimalsValue, uint8 collateralDecimalsValue)
        public
        ChainlinkPairAggregator(aggregatorAddress, responseDecimalsValue, collateralDecimalsValue)
        {}

    /** External Functions */

    /** Internal Functions */
    function _normalizeResponse(int256 response) internal view returns (int256) {
        return _inverseValue(response);
    }

    function _inverseValue(int256 value) internal view returns (int256) {
        return (int256(TEN ** collateralDecimals) * int256(TEN ** responseDecimals)) / value;
    }
}
