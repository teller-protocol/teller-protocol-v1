pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./TInitializable.sol";
import "./DynamicProxy.sol";

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";

// Interfaces
import "../interfaces/LoansInterface.sol";
import "../interfaces/EscrowFactoryInterface.sol";
import "../interfaces/EscrowInterface.sol";

// Commons
import "../util/AddressLib.sol";
import "../util/AddressArrayLib.sol";

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
    @notice This contract is used as a factory for the escrow contract that will be owned by the borrowers.

    @author develop@teller.finance
 */
contract EscrowFactory is EscrowFactoryInterface, TInitializable, BaseUpgradeable {
    using AddressArrayLib for address[];
    using AddressLib for address;
    using Address for address;

    /* State Variables */

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

    /* Modifiers */

    /**
        @notice It checks whether the platform is paused or not.
        @dev It throws a require error if the platform is used.
     */
    modifier isNotPaused() {
        require(!settings().isPaused(), "PLATFORM_IS_PAUSED");
        _;
    }

    /**
        @notice It creates an Escrow contract for a given loan id.
        @param loansAddress address of the loans contract that is creating an escrow.
        @param loanID loan id to associate to the new escrow instance.
        @return the new escrow instance.
     */
    function createEscrow(address loansAddress, uint256 loanID)
        external
        isInitialized()
        isNotPaused()
        returns (address escrowAddress)
    {
        TellerCommon.Loan memory loan = LoansInterface(loansAddress).loans(loanID);
        require(loan.escrow == address(0x0), "LOAN_ESCROW_ALREADY_EXISTS");

        bytes32 escrowLogicName = settings().versionsRegistry().consts().ESCROW_LOGIC_NAME();
        escrowAddress = address(new DynamicProxy(address(settings()), escrowLogicName));
        emit EscrowCreated(
            loan.loanTerms.borrower,
            loansAddress,
            loanID,
            escrowAddress
        );
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
        dappsList.add(dapp);

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
     */
    function initialize(address settingsAddress)
        external
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");

        _initialize();
        _setSettings(settingsAddress);
    }

    /** Internal Functions */

    /**
        @notice It tests whether an address is a dapp or not.
        @param dapp address to test.
        @return true if the address is a dapp. Otherwise it returns false.
     */
    function _isDapp(address dapp) internal view returns (bool) {
        return dapps[dapp];
    }
}
