pragma solidity ^0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./ChainlinkPairAggregator.sol";

interface IChainlinkPairAggregatorRegistry {
    
    struct PairAggregatorRegisterRequest {
        address baseToken;
        address quoteToken;
        address chainlinkAggregatorAddress;
        bool inverse;
        uint8 responseDecimals;
        uint8 collateralDecimals;
    }

    event PairAggregatorRegistered(
        address indexed baseSymbol,
        address indexed quoteSymbol,
        address pairAggregatorAddress
    );

    function getPairAggregator(address baseToken, address quoteToken) external view returns (PairAggregatorInterface);

    function hasPairAggregator(address baseToken, address quoteToken) external view returns (bool);

    function registerPairAggregator(PairAggregatorRegisterRequest calldata request) external returns (PairAggregatorInterface aggregator);

    function initialize(address settingsAddress) external;
}
