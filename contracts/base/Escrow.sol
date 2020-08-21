pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./TInitializable.sol";

// Interfaces
import "../interfaces/EscrowFactoryInterface.sol";
import "../interfaces/EscrowInterface.sol";
import "../interfaces/LoansInterface.sol";

// Libraries
import "../util/TellerCommon.sol";
import "../util/AddressLib.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "../interfaces/SettingsInterface.sol";

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
    @notice This contract is used by borrowers to call DApp functions (using delegate calls).
    @notice In order to call a DApp function, the DApp must be added in the EscrowFactory instance.
    @dev The current DApp implementations are: Uniswap and Compound.

    @author develop@teller.finance
 */
contract Escrow is TInitializable, EscrowInterface {
    using Address for address;
    using Address for address payable;
    using AddressLib for address;
    using AddressLib for address payable;

    /**
        @notice The platform settings.
     */
    SettingsInterface public settings;

    /**
        @notice This is the escrow factory instance.
        @dev It is used to validate the dapps are valid.
     */
    EscrowFactoryInterface public factory;

    /**
        @notice It is the current loans contract instance.
     */
    LoansInterface public loans;

    /**
        @notice This loan id refers the loan in the loans contract.
        @notice This loan was taken out by a borrower.
     */
    uint256 public loanID;

    /**
        @notice It checks whether the sender is the borrower or not.
        @dev It throws a require error if the sender is not the borrower associated to the current loan id.
     */
    modifier onlyBorrower() {
        require(_isBorrower(), "CALLER_NOT_BORROWER");
        _;
    }

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        isInitialized()
        onlyBorrower()
    {
        require(factory.isDapp(dappData.location), "DAPP_NOT_WHITELISTED");

        (bool success, ) = dappData.location.delegatecall(dappData.data);

        require(success, "DAPP_CALL_FAILED");
    }

    /** Internal Functions */

    /**
        @notice It initializes this Escrow contract. Should only be called from the constructor of the UpgradeableEscrowProxy.
        @param settingsAddress the Settings contract address.
        @param loansAddress the Loans contract address.
        @param aLoanID the loanID associated to this Escrow contract.
     */
    function _initialize(address settingsAddress, address loansAddress, uint256 aLoanID)
        internal
        isNotInitialized()
    {
        require(settingsAddress.isContract(), "SETTINGS_MUST_BE_A_CONTRACT");
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");
        require(msg.sender.isContract(), "SENDER_MUST_BE_A_CONTRACT");

        _initialize();

        settings = SettingsInterface(settingsAddress);
        factory = EscrowFactoryInterface(msg.sender);
        loans = LoansInterface(loansAddress);
        loanID = aLoanID;
    }

    /**
        @notice It checks whether the sender is the loans borrower or not.
        @dev It throws a require error it sender is not the loans borrower.
     */
    function _isBorrower() internal view returns (bool) {
        return msg.sender == loans.loans(loanID).loanTerms.borrower;
    }
}
