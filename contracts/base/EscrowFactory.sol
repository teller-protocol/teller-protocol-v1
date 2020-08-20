pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/lifecycle/Pausable.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/EscrowFactoryInterface.sol";
import "../interfaces/LoansInterface.sol";

// Commons
import "../util/AddressLib.sol";
import "../util/AddressArrayLib.sol";
import "../interfaces/EscrowInterface.sol";
import "../interfaces/SettingsInterface.sol";

import "./TInitializable.sol";

/**
    @notice This contract is used as a factory for the escrow contract that will be owned by the borrowers.

    @author develop@teller.finance
 */
contract EscrowFactory is Pausable, TInitializable, EscrowFactoryInterface {
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    /* State Variables */

    /**
        @notice The platform settings.
     */
    SettingsInterface public settings;

    /**
        @notice It defines whether a DApp exists or not.
        Example:
            address(0x123...456) => true
            address(0x456...789) => false
     */
    mapping(address => bool) public dapps;

    /**
        @notice It contains all the dapps added in this factory.
     */
    address[] public dappsList;

    /**
        This is used to get the Escrow byte code.
     */
    address public escrowLibrary;

    /* Modifiers */

    /**
        @notice It checks whether the platform is paused or not.
        @dev It throws a require error if the platform is used.
     */
    modifier isNotPaused() {
        require(!settings.isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    // TODO Who can call this function?
    /**
        @notice It creates an Escrow contract for a given loan id.
        @param borrower borrower address associated to the loan.
        @param loanID loan id to associate to the new escrow instance.
        @return the new escrow instance address.
     */
    function createEscrow(address borrower, uint256 loanID)
        external
        isNotPaused()
        isInitialized()
        returns (address newEscrowAddress)
    {
        borrower.requireNotEmpty("BORROWER_MUSTNT_BE_EMPTY");
        // TODO Add require msg.sender is a contract?

        newEscrowAddress = _createEscrowAddress(loanID);
        EscrowInterface escrow = EscrowInterface(newEscrowAddress);
        escrow.initialize(msg.sender, loanID);

        emit EscrowCreated(borrower, msg.sender, loanID, newEscrowAddress);
    }

    /**
        @notice It tests whether an address is a dapp or not.
        @param dapp address to test.
        @return true if the address is a dapp. Otherwise it returns false.
     */
    function isDapp(address dapp) external view returns (bool) {
        return _isDapp(dapp);
    }

    /**
        @notice It adds a new dapp to the factory.
        @param dapp address to add in this factory.
     */
    function addDapp(address dapp) external onlyPauser() isInitialized() {
        require(dapp.isContract(), "DAPP_ISNT_A_CONTRACT");
        require(!_isDapp(dapp), "DAPP_ALREADY_EXIST");

        dapps[dapp] = true;
        dappsList.push(dapp);

        emit NewDAppAdded(msg.sender, dapp);
    }

    /**
        @notice It removes a current dapp from the factory.
        @param dapp address to remove.
     */
    function removeDapp(address dapp) external onlyPauser() isInitialized() {
        require(dapp.isContract(), "DAPP_ISNT_A_CONTRACT");
        require(_isDapp(dapp), "DAPP_NOT_EXIST");

        dapps[dapp] = false;
        dappsList.remove(dapp);

        emit DAppRemoved(msg.sender, dapp);
    }

    /**
        @notice Gets all the dapps in the factory.
        @return an array of dapps (addresses).
     */
    function getDapps() external view returns (address[] memory) {
        return dappsList;
    }

    /**
        @notice It initializes this escrow contract factory instance.
        @param settingsAddress the settings contract address.
        @param escrowLibraryAddress the escrow contract address.
     */
    function initialize(address settingsAddress, address escrowLibraryAddress)
        public
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(escrowLibraryAddress.isContract(), "ESCROW_LIB_MUST_BE_A_CONTRACT");

        TInitializable._initialize();
        Pausable.initialize(msg.sender);

        escrowLibrary = escrowLibraryAddress;
        settings = SettingsInterface(settingsAddress);
    }

    /** Internal Functions */

    /**
        @notice Computes a salt value given a loan id and sender address.
        @return the computed salt value.
     */
    function _computeEscrowSalt(uint256 loanID) internal view returns (bytes32) {
        return keccak256(abi.encodePacked(msg.sender, loanID));
    }

    /**
        @notice Gets the Escrow contract bytecode given the escrow contract address.
        @return the escrow contract bytecode.
     */
    function _getEscrowBytecode() internal view returns (bytes memory) {
        bytes20 targetBytes = bytes20(escrowLibrary);

        bytes memory bytecode = new bytes(0x37);
        assembly {
            mstore(
                add(bytecode, 0x20),
                0x3d602d80600a3d3981f3363d3d373d3d3d363d73000000000000000000000000
            )
            mstore(add(bytecode, 0x34), targetBytes)
            mstore(
                add(bytecode, 0x48),
                0x5af43d82803e903d91602b57fd5bf30000000000000000000000000000000000
            )
        }

        return bytecode;
    }

    /**
        @notice Computes an escrow contract address given a loan id.
        @param loanID loan id to compute the escrow address.
        @return the escrow contract address.
     */
    function _computeEscrowAddress(uint256 loanID)
        internal
        view
        returns (address result)
    {
        bytes32 data = keccak256(
            abi.encodePacked(
                bytes1(0xff),
                address(this),
                _computeEscrowSalt(loanID),
                keccak256(_getEscrowBytecode())
            )
        );
        return address(bytes20(data << 96));
    }

    /**
        @notice It tests whether an address is a dapp or not.
        @param dapp address to test.
        @return true if the address is a dapp. Otherwise it returns false.
     */
    function _isDapp(address dapp) internal view returns (bool) {
        return dapps[dapp];
    }

    /**
        @notice It creates a new Escrow contract instance.
        @param loanID loan ID associated to this escrow contract.
        @return the new escrow contract address.
     */
    function _createEscrowAddress(uint256 loanID)
        internal
        returns (address newEscrowAddress)
    {
        bytes32 salt = _computeEscrowSalt(loanID);
        bytes memory bytecode = _getEscrowBytecode();
        assembly {
            newEscrowAddress := create2(0, add(bytecode, 0x20), mload(bytecode), salt)
        }
    }
}
