pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Commons

// Interfaces
import "../interfaces/SettingsInterface.sol";

// Contracts
import "./upgradeable/DynamicUpgradeable.sol";
import "./BaseStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                              THIS CONTRACT IS AN UPGRADEABLE FACET!                             **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT place ANY storage/state variables directly in this contract! If you wish to make        **/
/**  make changes to the state variables used by this contract, do so in its defined Storage        **/
/**  contract that this contract inherits from                                                      **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as a base contract for most most of the contracts in the platform.
    @notice It allows contracts to have access to the platform settings, and common modifiers.

    @author develop@teller.finance.
 */
contract Base is DynamicUpgradeable, BaseStorage {
    using AddressLib for address;
    using Address for address;

    /** Modifiers */

    /**
          @notice Checks if sender has a pauser role
          @dev Throws an error if the sender has not a pauser role.
       */
    modifier onlyPauser() {
        settings.requirePauserRole(msg.sender);
        _;
    }

    modifier onlyAuthorized() {
        settings.requireAuthorization(msg.sender);
        _;
    }

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

    /* Constructor */

    /** External Functions */

    /** Internal functions */

    /**
        @notice It initializes the current contract instance setting the required parameters.
        @param settingsAddress settings contract address.
     */
    function _initialize(address settingsAddress) internal {
        settingsAddress.requireNotEmpty("SETTINGS_MUST_BE_PROVIDED");

        settings = SettingsInterface(settingsAddress);
        assetSettings = AssetSettingsInterface(settings.assetSettings());
    }

    /**
        @notice Checks if a specific lending pool address is paused or not.
        @param poolAddress lending pool address to check.
        @return true if the lending pool address is  paused. Otherwise it returns false.
     */
    function _isPoolPaused(address poolAddress) internal view returns (bool) {
        return settings.lendingPoolPaused(poolAddress);
    }

    /**
        @notice Checks if the platform is paused or not.
        @return true if platform is paused. Otherwise it returns false.
     */
    function _isPaused() internal view returns (bool) {
        return settings.isPaused();
    }

    /** Private functions */
}
