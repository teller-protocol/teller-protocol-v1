pragma solidity 0.5.17;

// Libraries
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../util/AddressLib.sol";

// Commons
import "./Initializable.sol";

// Interfaces
import "../interfaces/SettingsInterface.sol";


/**
    @notice This contract is used as a base contract for most most of the contracts in the platform.
    @notice It allows contracts to have access to the platform settings, and common modifiers.
    @notice It implements the reentrancy guard from Open Zeppelin and the initializable pattern.

    @author develop@teller.finance.
 */
contract Base is Initializable, ReentrancyGuard {
    using AddressLib for address;
    using Address for address;

    /* State Variables */

    SettingsInterface public settings;

    /** Modifiers */

    /**
        @notice Checks whether the platform is paused or not.
        @dev It throws a require error if platform is paused.
     */
    modifier whenNotPaused() {
        require(!_isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    /**
        @notice Checks whether a specific lending pool address is paused or not.
        @dev It throws a require error if the lending pool is paused.
        @param lendingPoolAddress lending pool address to check.
     */
    modifier whenLendingPoolNotPaused(address lendingPoolAddress) {
        require(!_isPoolPaused(lendingPoolAddress), "LENDING_POOL_IS_PAUSED");
        _;
    }

    /**
        @notice Checks whether the platform is paused or not.
        @dev It throws a require error if platform is not paused.
     */
    modifier whenPaused() {
        require(_isPaused(), "PLATFORM_IS_NOT_PAUSED");
        _;
    }

    /**
        @notice Checks whether a specific lending pool address is paused or not.
        @dev It throws a require error if the lending pool is not paused.
        @param lendingPoolAddress lending pool address to check.
     */
    modifier whenLendingPoolPaused(address lendingPoolAddress) {
        require(_isPoolPaused(lendingPoolAddress), "LENDING_POOL_IS_NOT_PAUSED");
        _;
    }

    /* Constructor */

    /** External Functions */

    /** Internal functions */

    /**
        @notice It initializes the current contract instance setting the required parameters.
        @param settingsAddress settings contract address.
     */
    function _initialize(address settingsAddress) internal isNotInitialized() {
        settingsAddress.requireNotEmpty("SETTINGS_MUST_BE_PROVIDED");
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();

        settings = SettingsInterface(settingsAddress);
    }

    /**
        @notice Gets if a specific lending pool address is paused or not.
        @param poolAddress lending pool address to check.
        @return true if the lending pool address is  paused. Otherwise it returns false.
     */
    function _isPoolPaused(address poolAddress) internal view returns (bool) {
        return settings.lendingPoolPaused(poolAddress);
    }

    /**
        @notice Gets if the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function _isPaused() internal view returns (bool) {
        return settings.isPaused();
    }

    /** Private functions */
}
