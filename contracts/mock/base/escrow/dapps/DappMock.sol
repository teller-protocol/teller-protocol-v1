pragma solidity 0.5.17;

import "../../../../interfaces/IBaseProxy.sol";
import "../../../../base/BaseUpgradeable.sol";

contract DappMock is IBaseProxy, BaseUpgradeable {
    function testFunction(bool failTransaction) external pure {
        require(!failTransaction, "TEST_FUNCTION_FAILED");
    }

    function implementation() external view returns (address) {
        return address(this);
    }

    function setSettings(address settingsAddress) external {
        _setSettings(settingsAddress);
    }
}
