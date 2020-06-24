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

import "@chainlink/contracts/src/v0.5/interfaces/AggregatorInterface.sol";
import "../../interfaces/PairAggregatorInterface.sol";

contract ChainlinkPairAggregator is PairAggregatorInterface {

    uint256 internal constant TEN = 10;

    AggregatorInterface public aggregator;
    uint8 public responseDecimals;
    uint8 public collateralDecimals;

    constructor(address aggregatorAddress, uint8 responseDecimalsValue, uint8 collateralDecimalsValue) public {
        require(aggregatorAddress != address(0x0), "PROVIDE_AGGREGATOR_ADDRESS");
        aggregator = AggregatorInterface(aggregatorAddress);
        responseDecimals = responseDecimalsValue;
        collateralDecimals = collateralDecimalsValue;
    }

    /** External Functions */

    function getLatestAnswer() external view returns (int256) {
        int256 latestAnswerInverted = aggregator.latestAnswer();
        return _normalizeResponse(latestAnswerInverted);
    }

    function getPreviousAnswer(uint256 roundsBack) external view returns (int256) {
        int256 answer = _getPreviousAnswer(roundsBack);
        return _normalizeResponse(answer);
    }

    function getLatestTimestamp() external view returns (uint256) {
        return aggregator.latestTimestamp();
    }

    function getLatestRound() external view returns (uint256) {
        return aggregator.latestRound();
    }

    function getPreviousTimestamp(uint256 roundsBack) external view returns (uint256) {
        uint256 latest = aggregator.latestRound();
        require(roundsBack <= latest, "NOT_ENOUGH_HISTORY");
        return aggregator.getTimestamp(latest - roundsBack);
    }

    /** Internal Functions */

    function _getPreviousAnswer(uint256 roundsBack) internal view returns (int256) {
        uint256 latest = aggregator.latestRound();
        require(roundsBack <= latest, "NOT_ENOUGH_HISTORY");
        return aggregator.getAnswer(latest - roundsBack);
    }

    function _normalizeResponse(int256 response) internal view returns (int256) {
        if( collateralDecimals >= responseDecimals) {
            uint8 pendingDecimals = collateralDecimals - responseDecimals;
            return value * int256(TEN ** pendingDecimals);
        } else {
            uint8 pendingDecimals = responseDecimals - collateralDecimals;
            return value / int256(TEN ** pendingDecimals);
        }
    }
}
