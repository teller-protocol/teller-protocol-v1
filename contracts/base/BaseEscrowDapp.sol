pragma solidity 0.5.17;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/ownership/Ownable.sol";
import "./BaseUpgradeable.sol";

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

// Libraries
import "../util/AddressArrayLib.sol";

contract BaseEscrowDapp is Ownable, BaseUpgradeable {
    using AddressArrayLib for address[];

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
    address[] private tokens;

    /**
        @notice Returns an array of token addresses, for which this Escrow contract has a balance.
        @return The list of all tokens held by this contract.
     */
    function getTokens() public view returns (address[] memory) {
        return tokens;
    }

    /**
        @notice Returns the index of a given token address from the stored address array.
        @param tokenAddress The contract address for which the index is required.
        @return The index number of the token contract address, stored in the Escrow's array.
     */
    function findTokenIndex(address tokenAddress)
        external
        view
        returns (int256)
    {
        (bool found, uint256 index) = tokens.getIndex(tokenAddress);
        return found ? int256(index) : -1;
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
            tokens.removeAt(index);
            emit TokenRemoved(tokenAddress, index);
        }
    }

    /**
        @notice Sets an inital list of tokens that will be held by this Escrow contract.
        @param tokenList An array of token address to be added to the the list of tokens held by the Escrow.
     */
    function _setTokens(address[] memory tokenList) internal {
        tokens = tokenList;
    }
}
