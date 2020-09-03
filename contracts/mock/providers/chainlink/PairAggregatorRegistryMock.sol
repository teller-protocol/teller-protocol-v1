pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../../providers/chainlink/ChainlinkPairAggregatorRegistry.sol";

contract PairAggregatorRegistryMock is ChainlinkPairAggregatorRegistry {
    function externalAddAggregatorFor(
        address baseAddress,
        address quoteAddress,
        address aggregatorAddress
    ) external {
        aggregators[baseAddress][quoteAddress] = PairAggregatorInterface(
            aggregatorAddress
        );
    }
}
