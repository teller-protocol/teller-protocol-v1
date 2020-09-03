pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Settings.sol";

contract SettingsMock is Settings {
    function externalSetPairAggregatorRegistry(address registryAddress) external {
        pairAggregatorRegistry = IChainlinkPairAggregatorRegistry(registryAddress);
    }
}
