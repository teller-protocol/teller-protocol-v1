pragma solidity 0.5.17;

import "../../base/BaseUpgradeable.sol";

contract BaseUpgradeableMock is BaseUpgradeable {
    function externalOnlyPauser() external onlyPauser() {}

    function externalSetSettings(address settingsAddress) external {
        _setSettings(settingsAddress);
    }

    function externalSetLogicName(bytes32 aLogicName) external {
        _setLogicName(aLogicName);
    }

    function externalLogicName() external view returns (bytes32 name) {
        return logicName();
    }
}
