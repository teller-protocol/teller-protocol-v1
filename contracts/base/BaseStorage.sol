// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../interfaces/SettingsInterface.sol";

// Contracts
import "./upgradeable/DynamicUpgradeableStorage.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                        THIS CONTRACT IS A NON UPGRADEABLE STORAGE CONTRACT!                     **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of, PREPEND, or APPEND any storage variables to this or new versions   **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract is used as the base storage contract for most of the contracts in the platform.
 * @notice It allows contracts to have access to the platform settings instance.
 *
 * @author develop@teller.finance.
 */
abstract contract BaseStorage {
    /**
     * @notice It holds the platform Settings instance.
     */
    SettingsInterface public settings;

    /**
     * @dev This allocates additional storage slots in the event that additional state variables are added.
     */
    uint256[10] internal __gap;
}
