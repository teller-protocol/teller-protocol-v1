pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "../../interfaces/SettingsInterface.sol";
import "./IChainlinkPairAggregatorRegistry.sol";
import "../../base/TInitializable.sol";

// Contracts
import "./ChainlinkPairAggregator.sol";
import "../../base/DynamicProxy.sol";

// Commons
import "../../util/AddressLib.sol";
import "../../util/LogicVersionsConsts.sol";

// TODO Add docs.
contract ChainlinkPairAggregatorRegistry is IChainlinkPairAggregatorRegistry, TInitializable, LogicVersionsConsts {
    using AddressLib for address;
    using Address for address;

    SettingsInterface public settings;

    mapping(address => mapping(address => PairAggregatorInterface)) public aggregators;

    /** Modifiers **/

    modifier onlyPauser() {
        settings.requirePauserRole(msg.sender);
        _;
    }

    /** Public Functions **/

    function registerPairAggregator(PairAggregatorRegisterRequest calldata request)
        external
        isInitialized()
        onlyPauser()
        returns (PairAggregatorInterface aggregator)
    {
        // TODO Do we need to create an update function?
        // TODO Do we need to validate the new request is already registered?
        bytes32 logicName = settings.versionsRegistry().consts().CHAINLINK_PAIR_AGGREGATOR_LOGIC_NAME();

        DynamicProxy pairAggregatorProxy = new DynamicProxy(address(settings), logicName);

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
            request.baseToken,
            request.quoteToken,
            pairAggregatorAddress
        );
    }

    function initialize(address settingsAddress)
        external
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_NOT_A_CONTRACT");

        _initialize();
        
        settings = SettingsInterface(settingsAddress);
    }

    function getPairAggregator(address baseToken, address quoteToken) external view returns (PairAggregatorInterface) {
        return aggregators[baseToken][quoteToken];
    }

    function hasPairAggregator(address baseToken, address quoteToken) external view returns (bool) {
        return address(aggregators[baseToken][quoteToken]) !=  address(0x0);
    }
}
