pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "../../interfaces/SettingsInterface.sol";
import "./IChainlinkPairAggregatorRegistry.sol";
import "../../base/TInitializable.sol";

// Contracts
import "./ChainlinkPairAggregator.sol";
import "./ChainlinkPairAggregatorProxy.sol";

// Commons
import "../../util/AddressLib.sol";

contract ChainlinkPairAggregatorRegistry is IChainlinkPairAggregatorRegistry, TInitializable {
    using AddressLib for address;
    using Address for address;

    SettingsInterface public settings;

    address public pairAggregatorLogic;

    mapping(string => mapping(string => PairAggregatorInterface)) public aggregators;

    /** Modifiers **/

    modifier onlyPauser() {
        require(settings.hasPauserRole(msg.sender), "ONLY_PAUSER");
        _;
    }

    /** Public Functions **/

    function register(PairAggregatorRegisterRequest calldata request)
        external
        isInitialized()
        onlyPauser()
        returns (PairAggregatorInterface aggregator)
    {
        ChainlinkPairAggregatorProxy proxy = new ChainlinkPairAggregatorProxy(address(settings));
        address pairAggregatorAddress = address(proxy);
        aggregator = PairAggregatorInterface(pairAggregatorAddress);
        aggregator.initialize(
            request.chainlinkAggregatorAddress,
            request.inverse,
            request.responseDecimals,
            request.collateralDecimals
        );
        aggregators[request.baseSymbol][request.quoteSymbol] = aggregator;

        emit PairAggregatorRegistered(
            request.baseSymbol,
            request.quoteSymbol,
            pairAggregatorAddress
        );
    }

    function updatePairAggregatorLogic(address newLogic)
        external
        isInitialized()
        onlyPauser()
    {
        require(newLogic.isContract(), "NEW_LOGIC_NOT_CONTRACT");
        newLogic.requireNotEqualTo(pairAggregatorLogic, "NEW_LOGIC_SAME");

        address oldLogic = pairAggregatorLogic;
        pairAggregatorLogic = newLogic;

        emit ChainlinkPairAggregatorUpdated(msg.sender, oldLogic, newLogic);
    }

    function initialize(
        address settingsAddress,
        address pairAggregatorLogicAddress
    )
        public
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_NOT_A_CONTRACT");
        require(pairAggregatorLogicAddress.isContract(), "CHAINLINK_PAIR_AGGREGATOR_LOGIC_NOT_A_CONTRACT");

        settings = SettingsInterface(settingsAddress);
        pairAggregatorLogic = pairAggregatorLogicAddress;

        _initialize();
    }
}
