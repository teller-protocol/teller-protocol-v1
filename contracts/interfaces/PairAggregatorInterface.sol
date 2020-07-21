pragma solidity 0.5.17;

/**
    @notice This interface defines the functions to work with Oracle feeds.

    @author develop@teller.finance
 */
interface PairAggregatorInterface {

    /**
        @notice Gets the current answer from the aggregator.
        @return the latest answer.
     */
    function getLatestAnswer() external view returns (int256);

    /**
        @notice Gets the last updated height from the aggregator.
        @return the latest timestamp.
     */
    function getLatestTimestamp() external view returns (uint256);

    /**
        @notice Gets past rounds answer.
        @param roundsBack the answer number to retrieve the answer for
        @return the previous answer.
     */
    function getPreviousAnswer(uint256 roundsBack) external view returns (int256);

    /**
        @notice Gets block timestamp when an answer was last updated.
        @param roundsBack the answer number to retrieve the updated timestamp for.
        @return the previous timestamp.
     */
    function getPreviousTimestamp(uint256 roundsBack) external view returns (uint256);

    /**
        @notice Gets the latest completed round where the answer was updated.
        @return the latest round id.
    */
    function getLatestRound() external view returns (uint256);
}
