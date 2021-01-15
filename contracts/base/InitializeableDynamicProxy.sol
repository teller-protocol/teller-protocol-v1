pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/BaseUpgradeabilityProxy.sol";
import "./BaseDynamicProxy.sol";

/**
    @notice This is used as a proxy contract in the deployment process, allowing to us to make
    upgreadable the contracts.
    @dev The platform uses two types of proxies:
    - BaseDynamicProxy
    - BaseUpgradeabilityProxy (from OpenZeppelin).

    @author develop@teller.finance
 */
contract InitializeableDynamicProxy is BaseDynamicProxy, BaseUpgradeabilityProxy {
    /**
        @notice It initializes this proxy instance with a settings contract and a logic name.
        @param settingsAddress the settings contract address to use.
        @param aLogicName the logic name to use.
     */
    function initializeProxy(address settingsAddress, bytes32 aLogicName) public {
        require(!__isInitialized(), "DYN_PROXY_ALREADY_INITIALIZED");

        _setSettings(settingsAddress);
        _setLogicName(aLogicName);
    }

    /**
        @notice It returns if the proxy was initialized.
        @notice Uses double underscore (__) to avoid any collision in implementation contracts.
     */
    function __isInitialized() public view returns (bool) {
        return address(_getSettings()) != address(0x0);
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
