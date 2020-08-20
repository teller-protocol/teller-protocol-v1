pragma solidity 0.5.17;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../util/AddressLib.sol";

// Commons
import "./TInitializable.sol";

// Interfaces
import "../interfaces/SettingsInterface.sol";
import "../interfaces/MarketsStateInterface.sol";


/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE BASE!                              **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a base contract for most most of the contracts in the platform.
    @notice It allows contracts to have access to the platform settings, and common modifiers.
    @notice It implements the reentrancy guard from Open Zeppelin and the TInitializable pattern.

    @author develop@teller.finance.
 */
contract Base is TInitializable, ReentrancyGuard {
    using AddressLib for address;
    using Address for address;

    /* State Variables */

    SettingsInterface public settings;
    MarketsStateInterface public markets;

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

    /**
        @notice Checks whether a given address is allowed (see Settings#hasPauserRole function) or not.
        @dev It throws a require error if address is not allowed.
        @param anAddress account to test.
     */
    modifier whenAllowed(address anAddress) {
        require(settings.hasPauserRole(anAddress), "ADDRESS_ISNT_ALLOWED");
        _;
    }

    /* Constructor */

    /** External Functions */

    /** Internal functions */

    /**
        @notice It initializes the current contract instance setting the required parameters.
        @param settingsAddress settings contract address.
        @param marketsAddress markets state contract address.
     */
    function _initialize(address settingsAddress, address marketsAddress)
        internal
        isNotInitialized()
    {
        settingsAddress.requireNotEmpty("SETTINGS_MUST_BE_PROVIDED");
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        marketsAddress.requireNotEmpty("MARKETS_MUST_BE_PROVIDED");
        require(marketsAddress.isContract(), "MARKETS_MUST_BE_A_CONTRACT");

        _initialize();

        settings = SettingsInterface(settingsAddress);
        markets = MarketsStateInterface(marketsAddress);
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
