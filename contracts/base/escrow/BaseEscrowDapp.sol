pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "../Base.sol";
import "../escrow/EscrowStorage.sol";

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "../../interfaces/escrow/IBaseEscrowDapp.sol";
import "../../interfaces/loans/ILoanManager.sol";

// Libraries
import "../../util/AddressArrayLib.sol";

/**
 * @notice This contract defines functionality for all Dapp contracts MUST inherit.
 * @dev If any token balances are modified during a function call, you MUST call _tokenUpdate with the token address.
 *
 * @author develop@teller.finance
 */
contract BaseEscrowDapp is IBaseEscrowDapp, Base, EscrowStorage {
    using Address for address;
    using AddressArrayLib for AddressArrayLib.AddressArray;

    /* Modifiers */

    modifier onlyBorrower() {
        require(msg.sender == borrower, "NOT_BORROWER");
        _;
    }

    /* Public Functions */

    /**
     * @notice Returns an array of token addresses, for which this Escrow contract has a balance.
     * @return The list of all tokens held by this contract.
     */
    function getTokens() public view returns (address[] memory) {
        return tokens.array;
    }

    /* Internal Functions */

    /**
     * @notice Returns this contract's balance for the specified token.
     * @param tokenAddress token address.
     * @return The token balance of the tokenAddress held by this Escrow contract.
     */
    function _balanceOf(address tokenAddress) internal view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    /**
     * @notice Adds or removes tokens held by the Escrow contract
     * @param tokenAddress The token address to be added or removed
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
}
