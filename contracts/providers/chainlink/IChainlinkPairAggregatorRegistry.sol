pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./ChainlinkPairAggregator.sol";

interface IChainlinkPairAggregatorRegistry {
    struct PairAggregatorRegisterRequest {
        string baseSymbol;
        string quoteSymbol;
        address chainlinkAggregatorAddress;
        bool inverse;
        uint8 responseDecimals;
        uint8 collateralDecimals;
    }

    event PairAggregatorRegistered(
        string indexed baseSymbol,
        string indexed quoteSymbol,
        address pairAggregatorAddress
    );

    event ChainlinkPairAggregatorUpdated(
        address indexed sender,
        address oldLogic,
        address newLogic
    );

    function pairAggregatorLogic() external view returns (address);

    function inversePairAggregatorLogic() external view returns (address);

    function register(PairAggregatorRegisterRequest calldata request) external returns (PairAggregatorInterface aggregator);

    function updatePairAggregatorLogic(address newLogic) external;

    function initialize(address settingsAddress, address pairAggregatorLogicAddress, address inversePairAggregatorLogicAddress) external;
}
