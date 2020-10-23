pragma solidity 0.5.17;

// Interfaces
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV2V3Interface.sol";

interface IChainlinkAggregator {
    function aggregatorFor(address src, address dst) external view returns (AggregatorV2V3Interface, bool);

    function valueFor(address src, address dst, uint256 srcAmount) external view returns (uint256);

    function latestAnswerFor(address src, address dst) external view returns (int256);

    function latestTimestampFor(address src, address dst) external view returns (uint256);

    function add(address src, address dst, address aggregator) external;
}
