pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/TellerCommon.sol";

/**
    @notice This interface defines the functions to manage the Escrow contracts associated to borrowers and loans.

    @author develop@teller.finance
 */
interface IEscrowFactory {
    /**
        @notice It gets a dapp configuration based its contract address.
        @param dapp dapp address.
        @return TellerCommon.Dapp dapp configuration.
     */
    function dapps(address dapp) external view returns (TellerCommon.Dapp memory);

    /**
        @notice It creates an Escrow contract for a given loan id.
        @param borrower borrower address associated to the loan.
        @param loanID loan id to associate to the new escrow instance.
        @return the new escrow instance.
     */
    function createEscrow(address borrower, uint256 loanID) external returns (address);

    /**
        @notice It adds a new dapp to the factory.
        @param dapp address to add in this factory.
        @param unsecured boolean to describe in the dapp is allowed to be used with unsecured loans.
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
        @param settingsAddress the settings contract address.
     */
    function initialize(address settingsAddress) external;

    /**
        @notice This event is emitted when a new Escrow contract is created.
        @param borrower address associated to the new escrow.
        @param loansAddress loans contract address.
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
    event NewDappAdded(address indexed sender, address indexed dapp, bool unsecured);

    /**
        @notice This event is emitted when a dapp is updated.
        @param sender address.
        @param dapp address of dapp contract.
        @param unsecured boolean that describes if the dapp can be used by with an unsecured loan.
     */
    event DappUpdated(address indexed sender, address indexed dapp, bool unsecured);

    /**
        @notice This event is emitted when a current dapp is removed from the factory.
        @param sender address.
        @param dapp address removed from the factory.
     */
    event DappRemoved(address indexed sender, address indexed dapp);
}
