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
    AggregatorInterface public aggregator;

    constructor(address aggregatorAddress) public {
        require(aggregatorAddress != address(0x0), "Aggregator address is required.");
        aggregator = AggregatorInterface(aggregatorAddress);
    }

    function getLatestAnswer() external view returns (int256) {
        return aggregator.latestAnswer();
    }

    function getLatestTimestamp() external view returns (uint256) {
        return aggregator.latestTimestamp();
    }

    function getLatestRound() external view returns (uint256) {
        return aggregator.latestRound();
    }

    function getPreviousAnswer(uint256 roundsBack) external view returns (int256) {
        uint256 latest = aggregator.latestRound();
        require(roundsBack <= latest, "Not enough history");
        return aggregator.getAnswer(latest - roundsBack);
    }

    function getPreviousTimestamp(uint256 roundsBack) external view returns (uint256) {
        uint256 latest = aggregator.latestRound();
        require(roundsBack <= latest, "Not enough history");
        return aggregator.getTimestamp(latest - roundsBack);
    }
}
