pragma solidity 0.5.17;

interface PairAggregatorInterface {

    function getLatestAnswer() external view returns (int256);

    function getLatestTimestamp() external view returns (uint256);

    function getPreviousAnswer(uint256 timestampBack) external view returns (int256);

    function getPreviousTimestamp(uint256 timestampBack) external view returns (uint256);
}
