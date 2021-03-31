// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";

import "./DynamicUpgradeable.sol";

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
    @notice This contract enables us to have a DynamicUpgradeable ERC20 contract (TToken) using OZ contracts.

    @author develop@teller.finance.
 */
abstract contract DynamicUpgradeableERC20 is
    ERC20Upgradeable,
    DynamicUpgradeable
{

}
