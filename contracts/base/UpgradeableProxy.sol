pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/BaseUpgradeabilityProxy.sol";
import "./BaseUpgradeable.sol";

contract UpgradeableProxy is BaseUpgradeabilityProxy, BaseUpgradeable {
    function initializeProxy(address settingsAddress, address initialLogic) public {
        require(settingsAddress.isContract(), "SETTINGS_NOT_A_CONTRACT");
        require(initialLogic.isContract(), "INITIAL_LOGIC_NOT_A_CONTRACT");

        _setSettings(settingsAddress);
        _setImplementation(initialLogic);
    }

    function upgradeTo(address newLogic) public onlyPauser() {
        BaseUpgradeabilityProxy._upgradeTo(newLogic);
    }
}
