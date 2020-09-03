pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/BaseUpgradeabilityProxy.sol";
import "./BaseDynamicProxy.sol";

contract InitializeableDynamicProxy is BaseDynamicProxy, BaseUpgradeabilityProxy {
    function initializeProxy(address settingsAddress, bytes32 aLogicName) public {
        require(!__isInitialized(), "DYNAMIC_PROXY_ALREADY_INITIALIZED");

        _setSettings(settingsAddress);
        _setLogicName(aLogicName);
    }

    /**
        @notice It returns if the proxy was initialized.
        @notice Uses double underscore (__) to avoid any collision in implementation contracts.
     */
    function __isInitialized() public view returns (bool) {
        return address(settings()) != address(0x0);
    }

    /**
        @dev Returns the current implementation.
        @return Address of the current implementation
     */
    function _implementation() internal view returns (address) {
        if (__isInitialized()) {
            return BaseDynamicProxy._implementation();
        } else {
            return BaseUpgradeabilityProxy._implementation();
        }
    }
}
