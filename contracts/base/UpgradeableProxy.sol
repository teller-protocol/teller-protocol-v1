pragma solidity 0.5.17;

import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";


contract UpgradeableProxy is AdminUpgradeabilityProxy {
    /**
     * @dev Override ifAdmin to require caller to be the admin instead of calling the fallback.
     */
    modifier ifAdmin() {
        require(msg.sender == _admin(), "UPGRADABLE_CALLER_MUST_BE_ADMIN");
        _;
    }

    constructor(address _logic, address _admin, bytes memory _data)
        public
        payable
        AdminUpgradeabilityProxy(_logic, _admin, _data)
    {}

    /**
     * @return The address of the proxy admin.
     */
    function admin() external returns (address) {
        return _admin();
    }

    /**
     * @return The address of the implementation.
     */
    function implementation() external returns (address) {
        return _implementation();
    }

    /**
     * @dev Anyone can call the function on the derived contracts.
     */
    function _willFallback() internal {}
}
