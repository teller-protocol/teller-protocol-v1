pragma solidity 0.5.17;

import "./SettingsInterface.sol";

interface IBaseUpgradeable {
    function settings() external view returns (SettingsInterface);
}
