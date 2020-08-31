pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "../../interfaces/SettingsInterface.sol";
import "./IChainlinkPairAggregatorRegistry.sol";
import "../../base/TInitializable.sol";

// Contracts
import "./ChainlinkPairAggregator.sol";
import "../../base/DynamicProxy.sol";

// Commons
import "../../util/LogicVersionsConsts.sol";
import "../../util/TellerCommon.sol";

/**
    @notice This contract manages the Chainlink pair aggregator for the platform.
    @dev It is used by the Escrow Dapps, and the MarketFactory contract.

    @author developer@teller.finance
 */
contract ChainlinkPairAggregatorRegistry is TInitializable, BaseUpgradeable, IChainlinkPairAggregatorRegistry, LogicVersionsConsts {
    using Address for address;

    /**
        @notice This identifies the pair aggregator for a given market (borrowed / collateral tokens).
        @dev Examples:
            address(DAI) => address(ETH) => address(0x1234...5678)
            address(DAI) => address(LINK) => address(0x2345...789)
            address(USDC) => address(ETH) => address(0x345...7890)
            address(USDC) => address(LINK) => address(0x4567...890)
        @dev It uses 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE for ETH.
     */
    mapping(address => mapping(address => PairAggregatorInterface)) public aggregators;

    /** Modifiers **/

    /** Public Functions **/

    /**
        @notice It registers a new pair aggregator for a given market.
        @param request the input data to register the new pair aggregator.
        @return the new pair aggregator created.
     */
    function registerPairAggregator(TellerCommon.PairAggregatorRegisterRequest calldata request)
        external
        isInitialized()
        onlyPauser()
        returns (PairAggregatorInterface aggregator)
    {
        // TODO Do we need to create an update function?
        // TODO Do we need to validate the new request is already registered?
        bytes32 logicName = settings().versionsRegistry().consts().CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME();

        DynamicProxy pairAggregatorProxy = new DynamicProxy(address(settings()), logicName);

        address pairAggregatorAddress = address(pairAggregatorProxy);
        aggregator = PairAggregatorInterface(pairAggregatorAddress);
        aggregator.initialize(
            request.chainlinkAggregatorAddress,
            request.inverse,
            request.responseDecimals,
            request.collateralDecimals
        );
        aggregators[request.baseToken][request.quoteToken] = aggregator;

        emit PairAggregatorRegistered(
            msg.sender,
            request.baseToken,
            request.quoteToken,
            pairAggregatorAddress
        );
    }

    /**
        @notice It initializes this registry contract.
        @param settingsAddress this settings address.
     */
    function initialize(address settingsAddress)
        external
        isNotInitialized()
    {
        _setSettings(settingsAddress);

        _initialize();
    }

    /**
        @notice Gets a pair aggregator for a given base and quote tokens (a market).
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return the pair aggregator address for the given base and quote addresses.
     */
    function getPairAggregator(address baseToken, address quoteToken) external view returns (PairAggregatorInterface) {
        return aggregators[baseToken][quoteToken];
    }

    /**
        @notice Tests whether a pair aggregator exists for a given base and quote tokens (a market) or not.
        @notice baseToken the base token address.
        @notice quoteToken the quote token address.
        @return true if the pair aggregator address for the given base and quote tokens is not 0x0. Otherwise it returns false.
     */
    function hasPairAggregator(address baseToken, address quoteToken) external view returns (bool) {
        return address(aggregators[baseToken][quoteToken]) !=  address(0x0);
    }
}
