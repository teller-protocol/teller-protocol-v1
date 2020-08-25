pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/upgrades/contracts/upgradeability/AdminUpgradeabilityProxy.sol";

/**
 * @notice This contract is used a basis for the upgradeable contracts in the platform.
 * @dev It uses the AdminUpgradeabilityProxy contract (from OpenZeppelin).
 *
 * @author develop@teller.finance
 */
contract UpgradeableProxy is AdminUpgradeabilityProxy {
    /**
     * @dev Override ifAdmin to require caller to be the admin instead of calling the fallback.
     */
    modifier ifAdmin() {
        require(msg.sender == _admin(), "UPGRADABLE_CALLER_MUST_BE_ADMIN");
        _;
    }

    /**
        @notice It creates a new proxy instance.
        @param _logic address where is located the current logic.
        @param _admin address that will able to upgrade the logic.
        @param _data to initialize the proxy.
     */
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
