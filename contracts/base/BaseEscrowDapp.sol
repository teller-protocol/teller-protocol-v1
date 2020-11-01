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
        @notice An array of tokens that are owned by this escrow.
     */
    address[] private tokens;

    function getTokens() public view returns (address[] memory) {
        return tokens;
    }

    function findTokenIndex(address tokenAddress) external view returns (int256) {
        (bool found, uint256 index) = tokens.getIndex(tokenAddress);
        return found ? int256(index) : -1;
    }

    /**
        @notice Returns this contract's balance for the specified token.
        @param tokenAddress token address.
        @return this contract's balance.
     */
    function _balanceOf(address tokenAddress) internal view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function _tokenUpdated(address tokenAddress) internal {
        (bool found, uint256 index) = tokens.getIndex(tokenAddress);
        if (_balanceOf(tokenAddress) > 0) {
            if (!found) {
                tokens.add(tokenAddress);
            }
        } else if (found) {
            tokens.removeAt(index);
        }
    }

    function _setTokens(address[] memory tokenList) internal {
        tokens = tokenList;
    }
}
