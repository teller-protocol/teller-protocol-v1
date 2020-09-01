pragma solidity 0.5.17;

// Contracts

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";

// Libraries
import "../util/AddressArrayLib.sol";

// TODO: Use AddressLib to handle mapping/array
contract BaseEscrowDapp {
    using AddressArrayLib for address[];

    /**
        @notice An array of tokens that are owned by this escrow.
     */
    address[] private tokens;

    function getTokens() public view returns (address[] memory)  {
        return tokens;
    }

    function findTokenIndex(address tokenAddress) external view returns (int) {
        (bool found, uint256 index) = tokens.getIndex(tokenAddress);
        return found ? int(index) : -1;
    }

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
}