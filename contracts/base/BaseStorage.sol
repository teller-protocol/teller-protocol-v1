pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Interfaces
import "../interfaces/SettingsInterface.sol";

// Contracts
import "./upgradeable/DynamicUpgradeableStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                        THIS CONTRACT IS AN UPGRADEABLE STORAGE CONTRACT!                        **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice This contract is used as the base storage contract for most of the contracts in the platform.
    @notice It allows contracts to have access to the platform settings instance.

    @author develop@teller.finance.
 */
contract BaseStorage is DynamicUpgradeableStorage {
    /**
     * @notice It holds the platform settings instance.
     */
    SettingsInterface public settings;
}
