pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";

// Interfaces
import "../interfaces/EscrowInterface.sol";

// Libraries
import "./BaseEscrow.sol";
import "./BaseEscrowDapp.sol";

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
    @notice This contract should only be constructed using it's upgradeable Proxy contract.
    @notice In order to call a DApp function, the DApp must be added in the EscrowFactory instance.
    @dev The current DApp implementations are: Uniswap and Compound.

    @author develop@teller.finance
 */
contract Escrow is BaseEscrow, BaseEscrowDapp, EscrowInterface, TInitializable, Ownable {
    using Address for address;

    /** State Variables **/

    /**
        @notice It is the current loans contract instance.
     */
    LoansInterface public loans;

    /**
        @notice This loan id refers the loan in the loans contract.
        @notice This loan was taken out by a borrower.
     */
    uint256 public loanID;

    /** Modifiers **/

    modifier whenLoanActive() {
        require(getLoan().status == TellerCommon.LoanStatus.Active, "LOAN_NOT_ACTIVE");
        _;
    }

    /** Public Functions **/

    /**
        @notice It calls a given dapp using a delegatecall function by a borrower owned the current loan id associated to this escrow contract.
        @param dappData the current dapp data to be executed.
     */
    function callDapp(TellerCommon.DappData calldata dappData)
        external
        isInitialized()
        whenLoanActive()
        onlyOwner()
    {
        require(settings.escrowFactory().isDapp(dappData.location), "DAPP_NOT_WHITELISTED");

        (bool success, ) = dappData.location.delegatecall(dappData.data);

        require(success, "DAPP_CALL_FAILED");
    }

    /**
        @notice Gets the borrower for this Escrow's loan.
        @return address of this Escrow's loans
     */
    function getBorrower() public view returns (address) {
        return loans.loans(loanID).loanTerms.borrower;
    }

    function getLoan() public view returns (TellerCommon.Loan memory) {
        return loans.loans(loanID);
    }

    function purchaseLoanDebt() external whenLoanActive() {
    }

    /**
        @notice It initializes the instance of the Escrow.
        @param loansAddress the Loans contract address.
        @param aLoanID the loanID associated to this Escrow contract.
     */
    function initialize(address loansAddress, uint256 aLoanID)
        public
        isNotInitialized()
    {
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");

        loans = LoansInterface(loansAddress);
        loanID = aLoanID;

        initialize(getBorrower());

        // Initialize tokens list with the borrowed token.
        _tokenUpdated(loans.lendingToken());
    }

    /** Internal Functions */
}
