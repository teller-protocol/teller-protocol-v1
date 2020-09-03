pragma solidity 0.5.17;

/**
    @notice This interface defines the functions to manage the Escrow contracts associated to borrowers and loans.

    @author develop@teller.finance
 */
interface EscrowFactoryInterface {
    /**
        @notice It tests whether a dapp address exists in the factory or not.
        @param dapp dapp address to test.
        @return true if the dapp address already exists. Otherwise it returns false.
     */
    function isDapp(address dapp) external view returns (bool);

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
     */
    function addDapp(address dapp) external;

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
        @param dapp address addded to the factory.
     */
    event NewDAppAdded(address indexed sender, address indexed dapp);

    /**
        @notice This event is emitted when a current dapp is removed from the factory.
        @param sender address.
        @param dapp address removed from the factory.
     */
    event DAppRemoved(address indexed sender, address indexed dapp);
}
