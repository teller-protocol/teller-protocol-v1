pragma solidity 0.5.17;

// Contracts
import "./BaseUpgradeable.sol";
import "./TInitializable.sol";

// Interfaces
import "../interfaces/ITTokenRegistry.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice It manages all the registred TToken contract address, mapping each one to a boolean.

    @author develop@teller.finance
 */
contract TTokenRegistry is ITTokenRegistry, TInitializable, BaseUpgradeable {
    /* State Variables */

    /**
        @notice It represents a mapping to identify they contract address of a given TToken

        i.e.:
            address("0x479...584") => { True }.
            address("0x132...741") => { False }.
     */
    mapping(address => bool) public tokenRegistry;

    /**
        @notice It registers a new TToken contract address
        @param tToken Contract address of the TToken
     */
    function registerTToken(address tToken) external onlyPauser() isInitialized() {
        _registerTTokenAddress(tToken);
    }

    /**
        @notice Checks if a given address is a registered TToken contract
        @param tokenAddress The token contract address to check
        @return bool representing if the address is a registered TToken contract
     */
    function isTToken(address tokenAddress) external view isInitialized() returns (bool) {
        return (tokenRegistry[tokenAddress]);
    }

    /**
        @notice It initializes this ttoken registry contract instance
        @param settingsAddress The settings contract address
     */
    function initialize(address settingsAddress) external isNotInitialized() {
        require(settingsAddress.isContract(), "SETTINGS_NOT_A_CONTRACT");
        _initialize();
        _setSettings(settingsAddress);
    }

    /** Internal functions */

    /**
        @notice It registers a new given TToken contract address
        @param tToken Contract address of the TToken
     */
    function _registerTTokenAddress(address tToken) internal {
        require(tToken.isContract(), "ADDRESS_MUST_BE_CONTRACT");
        tokenRegistry[tToken] = true;

        emit TTokenRegistered(tToken, msg.sender);
    }
}
