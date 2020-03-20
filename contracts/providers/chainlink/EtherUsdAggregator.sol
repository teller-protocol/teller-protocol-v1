pragma solidity 0.5.17;

import "@chainlink/contracts/src/v0.5/dev/AggregatorInterface.sol";
import "../../interfaces/PairAggregatorInterface.sol";

contract EtherUsdAggregator is PairAggregatorInterface {
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

    function getPreviousAnswer(uint256 timestampBack) external view returns (int256) {
        uint256 latest = aggregator.latestRound();
        require(timestampBack <= latest, "Not enough history");
        return aggregator.getAnswer(latest - timestampBack);
    }

    function getPreviousTimestamp(uint256 timestampBack) external view returns (uint256) {
        uint256 latest = aggregator.latestRound();
        require(timestampBack <= latest, "Not enough history");
        return aggregator.getTimestamp(latest - timestampBack);
    }
}
