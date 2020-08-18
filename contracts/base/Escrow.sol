pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./TInitializable.sol";
import "./Escrow/EscrowStorage.sol";

// Interfaces
import "../interfaces/EscrowFactoryInterface.sol";
import "../interfaces/EscrowInterface.sol";
import "../interfaces/LoansInterface.sol";

// Libraries
import "../util/AddressLib.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";


// Commons

contract Escrow is TInitializable, EscrowInterface, EscrowStorage {
    using Address for address;
    using Address for address payable;
    using AddressLib for address;
    using AddressLib for address payable;

    EscrowFactoryInterface public factory;
    LoansInterface public loans;
    uint256 public loanID;

    struct DappData {
        address location;
        bytes data;
    }

    modifier onlyBorrower() {
        require(_isBorrower(), "CALLER_NOT_BORROWER");
        _;
    }

    function callDapp(DappData calldata dappData)
        external
        isInitialized()
        onlyBorrower()
    {
        require(factory.isDappWhitelisted(dappData.location), "DAPP_NOT_WHITELISTED");

        (bool success, bytes memory result) = dappData.location.delegatecall(
            dappData.data
        );

        require(success, string(result));
    }

    /**
        @notice It initialzes this Escrow contract.
        @param loansAddress the Loans contract address.
        @param aLoanID the loanID associated to this Escrow contract.
     */
    function initialize(address loansAddress, uint256 aLoanID)
        external
        isNotInitialized()
    {
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");
        require(msg.sender.isContract(), "SENDER_MUST_BE_A_CONTRACT");

        _initialize();

        factory = EscrowFactoryInterface(msg.sender);
        loans = LoansInterface(loansAddress);
        loanID = aLoanID;
        borrowedAsset = IERC20(loans.lendingToken());
    }

    /** Internal Functions */

    /**
        @notice It checks whether the sender is the loans borrower or not.
        @dev It throws a require error it sender is not the loans borrower.
     */
    function _isBorrower() internal view returns (bool) {
        return msg.sender == loans.loans(loanID).loanTerms.borrower;
    }
}
