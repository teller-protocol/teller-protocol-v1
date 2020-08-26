pragma solidity 0.5.17;

// Contracts
import "../../base/BaseProxy.sol";
import "./BaseChainlinkPairAggregator.sol";

contract ChainlinkPairAggregatorProxy is BaseProxy, BaseChainlinkPairAggregator {
    /**
        @notice It is a Proxy contract for ChainlinkPairAggregators that uses the logic implementation as defined in the global Settings contract.
        @param settingsAddress the global Settings address.
        @param isInverse determines whether or not this pair aggregator is inverse.
    */
    constructor(address settingsAddress, bool isInverse)
        public
    {
        require(settingsAddress.isContract(), "AGGREGATOR_NOT_CONTRACT");

        settings = SettingsInterface(settingsAddress);
        inverse = isInverse;
    }

    function _implementation() internal view returns (address) {
        if (inverse) {
            return settings.chainlinkPairAggregatorRegistry().inversePairAggregatorLogic();
        } else  {
            return settings.chainlinkPairAggregatorRegistry().pairAggregatorLogic();
        }
    }
}
