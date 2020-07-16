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

contract PairAggregatorMock is AggregatorInterface {

    struct PriceRound {
        uint256 timestamp;
        int256 price;
        uint256 round;
    }

    uint256 public latestRound;
    // round => price mapping
    mapping (uint256 => PriceRound) private prices;

    constructor(int256 initialPrice) public {
        latestRound = 1;
        prices[latestRound].timestamp = now;
        prices[latestRound].price = initialPrice;
        prices[latestRound].round = latestRound;
    }

    function setLatestAnswer(int256 newPrice) external returns (uint256) {
        latestRound += 1;
        prices[latestRound].timestamp = now;
        prices[latestRound].price = newPrice;
        prices[latestRound].round = latestRound;
    }

    function latestAnswer() external view returns (int256) {
        return prices[latestRound].price;
    }

    function latestTimestamp() external view returns (uint256) {
        return prices[latestRound].timestamp;
    }

    function getAnswer(uint256 roundsBack) external view returns (int256) {
        uint256 latest = latestRound;
        require(roundsBack <= latest, "NOT_ENOUGH_HISTORY");
        return prices[latest - roundsBack].price;
    }

    function getTimestamp(uint256 roundsBack) external view returns (uint256) {
        uint256 latest = latestRound;
        require(roundsBack <= latest, "NOT_ENOUGH_HISTORY");
        return prices[latest - roundsBack].timestamp;
    }
}
