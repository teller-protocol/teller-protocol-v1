pragma solidity 0.5.17;

// Interfaces
import "@chainlink/contracts/src/v0.5/interfaces/AggregatorV2V3Interface.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used to fetch and calculate prices and values from one token to another through Chainlink Aggregators.
    @dev It tries to find an aggregator using the token addresses supplied. If unable, it uses ETH as a pass through asset to construct a path conversion.

    @author develop@teller.finance
 */
interface IChainlinkAggregator {
    /**
        @notice It grabs the Chainlink Aggregator contract address for the token pair if it is supported.
        @param src Source token address.
        @param dst Destination token address.
        @return AggregatorV2V3Interface The Chainlink Aggregator address.
        @return bool whether or not the values from the Aggregator should be considered inverted.
     */
    function aggregatorFor(address src, address dst) external view returns (AggregatorV2V3Interface, bool);

    /**
        @notice It calculates the value of a token amount into another.
        @param src Source token address.
        @param dst Destination token address.
        @param srcAmount Amount of the source token to convert into the destination token.
        @return uint256 Value of the source token amount in destination tokens.
     */
    function valueFor(address src, address dst, uint256 srcAmount) external view returns (uint256);

    /**
        @notice It returns the price of the token pair as given from the Chainlink Aggregator.
        @dev It tries to use ETH as a pass through asset if the direct pair is not supported.
        @param src Source token address.
        @param dst Destination token address.
        @return uint256 The latest answer as given from Chainlink.
     */
    function latestAnswerFor(address src, address dst) external view returns (int256);

    /**
        @notice It allows for additional Chainlink Aggregators to be supported.
        @param src Source token address.
        @param dst Destination token address.
     */
    function add(address src, address dst, address aggregator) external;
}
