pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "../../util/TellerCommon.sol";
import "../../interfaces/PairAggregatorInterface.sol";

/**
    @notice It defines the functions to manager the pair aggregator address for specific markets (including the inversed markets).

    @author develop@teller.finance
 */
interface IChainlinkPairAggregatorRegistry {
    /**
        @notice This event is emitted when a new pair aggregator is registered.
        @param sender the sender address.
        @param baseToken the base token address.
        @param quoteToken the quote token address.
        @param pairAggregator the pair aggregator address.
     */
    event PairAggregatorRegistered(
        address indexed sender,
        address indexed baseToken,
        address indexed quoteToken,
        address pairAggregator
    );

    /**
        @notice This event is emitted when a current pair aggregator is updated.
        @param sender the sender address.
        @param baseToken the base token address.
        @param quoteToken the quote token address.
        @param oldPairAggregator the old pair aggregator address.
        @param newPairAggregator the new pair aggregator address.
     */
    event PairAggregatorUpdated(
        address indexed sender,
        address indexed baseToken,
        address indexed quoteToken,
        address oldPairAggregator,
        address newPairAggregator
    );

    /**
        @notice It registers a new pair aggregator for a given market.
        @param request the input data to register the new pair aggregator.
        @return the new pair aggregator created.
     */
    function registerPairAggregator(
        TellerCommon.PairAggregatorRegisterRequest calldata request
    ) external returns (PairAggregatorInterface aggregator);

    /**
        @notice It registers new pair aggregators for given markets.
        @param requests the input data to register the new pair aggregator.
        @return the new pair aggregator addresses.
     */
    function registerPairAggregators(
        TellerCommon.PairAggregatorRegisterRequest[] calldata requests
    ) external returns (PairAggregatorInterface[] memory newAggregators);

    /**
        @notice It updates a current pair aggregator for a given market.
        @param request the input data to register the new pair aggregator.
        @return the new pair aggregator created.
     */
    function updatePairAggregator(
        TellerCommon.PairAggregatorRegisterRequest calldata request
    ) external returns (PairAggregatorInterface aggregator);

    /**
        @notice It initializes this registry contract.
        @param settingsAddress this settings address.
     */
    function initialize(address settingsAddress) external;

    /**
        @notice Gets a pair aggregator for a given base and quote tokens (a market).
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return the pair aggregator address for the given base and quote addresses.
     */
    function getPairAggregator(address baseToken, address quoteToken)
        external
        view
        returns (PairAggregatorInterface);

    /**
        @notice Tests whether a pair aggregator exists for a given base and quote tokens (a market) or not.
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return true if the pair aggregator address for the given base and quote tokens is not 0x0. Otherwise it returns false.
     */
    function hasPairAggregator(address baseToken, address quoteToken)
        external
        view
        returns (bool);
}
