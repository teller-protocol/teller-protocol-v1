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
    constructor(address settingsAddress)
        public
    {
        require(settingsAddress.isContract(), "SETTINGS_NOT_CONTRACT");

        settings = SettingsInterface(settingsAddress);
    }

    function _implementation() internal view returns (address) {
        return settings.chainlinkPairAggregatorRegistry().pairAggregatorLogic();
    }
}
