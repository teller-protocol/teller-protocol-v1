pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/Mock.sol";
import "../../util/SettingsConsts.sol";
import "../../providers/chainlink/IChainlinkPairAggregatorRegistry.sol";

contract SettingsMock is Mock {
    SettingsConsts public consts;
    IChainlinkPairAggregatorRegistry public pairAggregatorRegistry;

    constructor() Mock() public {
        consts = new SettingsConsts();
    }

    function externalSetPairAggregatorRegistry(address registryAddress) external {
        pairAggregatorRegistry = IChainlinkPairAggregatorRegistry(registryAddress);
    }
}
