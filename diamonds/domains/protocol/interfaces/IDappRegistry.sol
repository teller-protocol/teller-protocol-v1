// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../libraries/TellerCommon.sol";

/**
    @notice This interface defines the functions to manage the Escrow contracts associated to borrowers and loans.

    @author develop@teller.finance
 */
interface IDappRegistry {
    /**
        @notice It gets a dapp configuration based on its contract address.
        @param dapp dapp address.
        @return the dapp details.
     */
    function dapps(address dapp)
        external
        view
        returns (TellerCommon.Dapp memory);

    /**
        @notice It adds a new dapp to the factory.
        @param dapp address to add in this factory.
        @param unsecured boolean to describe if the dapp is allowed to be used with unsecured loans.
     */
    function addDapp(address dapp, bool unsecured) external;

    /**
        @notice It updates a dapp configuration.
        @param dapp address to add in this factory.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    function updateDapp(address dapp, bool unsecured) external;

    /**
        @notice It removes a current dapp from the factory.
        @param dapp address to remove.
     */
    function removeDapp(address dapp) external;

    /**
        @notice Gets all the dapps in the factory.
        @return an array of dapps (addresses).
     */
    function getDapps() external view returns (address[] memory);

    /**
        @notice It initializes this escrow contract factory instance.
     */
    function initialize() external;

    /**
        @notice This event is emitted when a new Escrow contract is created.
        @param borrower address associated to the new escrow.
        @param loansAddress loan manager contract address.
        @param loanID loan id associated to the borrower and escrow contract.
        @param escrowAddress the new escrow contract address.
     */
    event EscrowCreated(
        address indexed borrower,
        address indexed loansAddress,
        uint256 indexed loanID,
        address escrowAddress
    );

    /**
        @notice This event is emitted when a new dapp is added to the factory.
        @param sender address.
        @param dapp address added to the factory.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event NewDappAdded(
        address indexed sender,
        address indexed dapp,
        bool unsecured
    );

    /**
        @notice This event is emitted when a dapp is updated.
        @param sender address.
        @param dapp address of dapp contract.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event DappUpdated(
        address indexed sender,
        address indexed dapp,
        bool unsecured
    );

    /**
        @notice This event is emitted when a current dapp is removed from the factory.
        @param sender address.
        @param dapp address removed from the factory.
     */
    event DappRemoved(address indexed sender, address indexed dapp);
}
