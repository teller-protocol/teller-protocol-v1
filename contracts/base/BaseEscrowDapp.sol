pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./Base.sol";

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "../interfaces/LoansInterface.sol";

// Libraries
import "../util/AddressArrayLib.sol";

contract BaseEscrowDapp is Base {
    using Address for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /** State Variables **/

    /**
        @notice It is the current loans contract instance.
     */
    LoansInterface private _loans;

    /**
        @notice This loan id refers the loan in the loans contract.
        @notice This loan was taken out by a borrower.
     */
    uint256 private _loanID;

    /**
        @notice The borrower's address that owns this Escrow loan.
     */
    address private _borrower;

    /**
        @notice The token that this Escrow loan was taken out with.
     */
    address internal _lendingToken;

    /**
        @notice This event is emitted when a new token is added to this Escrow.
        @param tokenAddress address of the new token.
        @param index Index of the added token.
     */
    event TokenAdded(address tokenAddress, uint256 index);

    /**
        @notice This event is emitted when a new token is removed from this Escrow.
        @param tokenAddress address of the removed token.
        @param index Index of the removed token.
     */
    event TokenRemoved(address tokenAddress, uint256 index);

    /**
        @notice An array of tokens that are owned by this escrow.
     */
    AddressArrayLib.AddressArray private tokens;

    /* Modifiers */

    modifier onlyBorrower() {
        require(msg.sender == _borrower, "NOT_BORROWER");
        _;
    }

    /* Public Functions */

    /**
        @notice Returns this Escrow's loan instance.
     */
    function getLoansContract() public view returns (LoansInterface) {
        return _loans;
    }

    /**
        @notice Returns an array of token addresses, for which this Escrow contract has a balance.
        @return The list of all tokens held by this contract.
     */
    function getTokens() public view returns (address[] memory) {
        return tokens.array;
    }

    /* External Functions */

    /**
        @notice Gets the borrower address that owns this Escrow loan.
        @return address of this Escrow's borrower.
     */
    function getBorrower() external view returns (address) {
        return _borrower;
    }

    /**
        @notice Returns this Escrow's loan id.
     */
    function getLoanID() external view returns (uint256) {
        return _loanID;
    }

    /**
        @notice Returns this Escrow's loan instance.
     */
    function getLoan() external view returns (TellerCommon.Loan memory) {
        return _getLoan();
    }

    /**
       @notice Returns the token this Escrow loan was taken out with.
       @return address of the Escrow lending token.
     */
    function lendingToken() external view returns (address) {
        return _lendingToken;
    }

    /* Internal Functions */

    function _getLoans() internal view returns (LoansInterface) {
        return _loans;
    }

    function _getLoanID() internal view returns (uint256) {
        return _loanID;
    }

    function _getLoan() internal view returns (TellerCommon.Loan memory) {
        return _loans.loans(_loanID);
    }

    /**
        @notice Returns this contract's balance for the specified token.
        @param tokenAddress token address.
        @return The token balance of the tokenAddress held by this Escrow contract.
     */
    function _balanceOf(address tokenAddress) internal view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    /**
        @notice Adds or removes tokens held by the Escrow contract
        @param tokenAddress The token address to be added or removed
     */
    function _tokenUpdated(address tokenAddress) internal {
        (bool found, uint256 index) = tokens.getIndex(tokenAddress);
        if (_balanceOf(tokenAddress) > 0) {
            if (!found) {
                tokens.add(tokenAddress);
                emit TokenAdded(tokenAddress, index);
            }
        } else if (found) {
            tokens.remove(index);
            emit TokenRemoved(tokenAddress, index);
        }
    }

    function _initialize(
        address loansAddress,
        uint256 aLoanID,
        address lendingToken
    ) internal {
        require(loansAddress.isContract(), "LOANS_MUST_BE_A_CONTRACT");

        _loans = LoansInterface(loansAddress);
        _loanID = aLoanID;
        _borrower = _getLoan().loanTerms.borrower;
        _lendingToken = lendingToken;
    }
}
