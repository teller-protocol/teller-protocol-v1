pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/BaseUpgradeabilityProxy.sol";
import "./BaseProxy.sol";

contract UpgradeableProxy is BaseUpgradeabilityProxy, BaseProxy {
    /**
        @notice It initializes this proxy instance.
        @param settingsAddress the settings address.
        @param initialLogic the initial logic address.
     */
    function initializeProxy(address settingsAddress, address initialLogic) public {
        require(settingsAddress.isContract(), "SETTINGS_NOT_A_CONTRACT");
        require(initialLogic.isContract(), "INITIAL_LOGIC_NOT_A_CONTRACT");

        _setSettings(settingsAddress);
        _setImplementation(initialLogic);
    }

    /**
        @notice It upgrades the current logic to a new logic address.
        @param newLogic the new logic address.
     */
    function upgradeTo(address newLogic) public onlyPauser() {
        BaseUpgradeabilityProxy._upgradeTo(newLogic);
    }
}
