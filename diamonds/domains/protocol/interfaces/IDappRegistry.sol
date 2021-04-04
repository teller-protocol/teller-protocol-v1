// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { Dapp } from "../data/dapp.sol";

/**
 * @notice This interface defines the functions to manage the Escrow contracts associated to borrowers and loans.

 * @author develop@teller.finance
 */
interface IDappRegistry {
    /**
     * @notice It gets a dapp configuration based on its contract address.
     * @param dapp dapp address.
     * @return the dapp details.
     */
    function dapps(address dapp) external view returns (Dapp memory);

    /**
     * @notice It adds a new dapp to the factory.
     * @param dapp address to add in this factory.
     * @param unsecured boolean to describe if the dapp is allowed to be used with unsecured loans.
     */
    function addDapp(address dapp, bool unsecured) external;

    /**
     * @notice It updates a dapp configuration.
     * @param dapp address to add in this factory.
     * @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    function updateDapp(address dapp, bool unsecured) external;

    /**
     * @notice It removes a current dapp from the factory.
     * @param dapp address to remove.
     */
    function removeDapp(address dapp) external;

    /**
     * @notice Gets all the dapps in the factory.
     * @return an array of dapps (addresses).
     */
    function getDapps() external view returns (address[] memory);
}
