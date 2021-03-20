pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../../util/AddressArrayLib.sol";

// Interfaces
import "../../interfaces/loans/ILoanManager.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                        THIS CONTRACT IS AN UPGRADEABLE STORAGE CONTRACT!                        **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions            **/
/**  of this contract as this will cause a ripple affect to the storage slots of all child          **/
/**  contracts that inherit from this contract to be overwritten on the deployed proxy contract!!   **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
 * @notice This contract is used by borrowers to call Dapp functions (using delegate calls).
 * @notice This contract should only be constructed using it's upgradeable Proxy contract.
 * @notice In order to call a Dapp function, the Dapp must be added in the DappRegistry instance.
 *
 * @author develop@teller.finance
 */
contract EscrowStorage {
    /* State Variables */

    /**
        @notice Holds the instance of the associated LoanManager contract for this Escrow loan.
     */
    ILoanManager public loanManager;

    /**
     * @notice Holds the address of the LendingPool used for this Escrow loan.
     */
    address public lendingPool;

    /**
     * @notice Holds the loan ID of the loan for this Escrow in the LoansManager contract.
     */
    uint256 public loanID;

    /**
     * @notice Holds the token that this Escrow loan was taken out with.
     */
    address public lendingToken;

    /**
     * @notice Holds the borrower's address that owns this Escrow loan.
     */
    address public borrower;

    /**
     * @notice An array of tokens that are owned by this escrow.
     */
    AddressArrayLib.AddressArray internal tokens;
}
