pragma solidity 0.5.17;

import "@openzeppelin/upgrades/contracts/upgradeability/BaseUpgradeabilityProxy.sol";
import "../../base/InitializeableDynamicProxy.sol";

contract InitializeableDynamicProxyMock is InitializeableDynamicProxy {
    function externalLogicName() external view returns (bytes32 name) {
        return logicName();
    }

    function externalSetImplementation(address newImplementation) external {
        return BaseUpgradeabilityProxy._setImplementation(newImplementation);
    }
}
