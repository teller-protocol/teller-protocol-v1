pragma solidity 0.5.17;

interface PairAggregatorInterface {
    function getLatestAnswer() external view returns (int256);

    function getLatestTimestamp() external view returns (uint256);

    function getPreviousAnswer(uint256 roundsBack) external view returns (int256);

    function getPreviousTimestamp(uint256 roundsBack) external view returns (uint256);

    function getLatestRound() external view returns (uint256);
}
