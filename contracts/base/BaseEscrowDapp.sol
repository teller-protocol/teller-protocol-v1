pragma solidity ^0.5.17;

// Contracts
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/IERC20.sol";
import "./BaseEscrow.sol";

// TODO: Use AddressLib to handle mapping/array
contract BaseEscrowDapp is BaseEscrow {
    /**
        @notice It tells us if this escrow has a token balance.
     */
    mapping(address => uint) public tokenIndices;

    /**
        @notice An array of tokens that are owned by this escrow.
     */
    address[] public tokens;

    function balanceOf(address tokenAddress) public view returns (uint256) {
        return IERC20(tokenAddress).balanceOf(address(this));
    }

    function calculateTotalValue() public view returns (uint256 value) {
        value = 0;
        for (uint i = 0; i < tokens.length; i++) {
            value += balanceOf(tokens[i]);
        }
    }

    function hasToken(address tokenAddress) public view returns (bool) {
        return tokens[tokenIndices[tokenAddress]] == tokenAddress;
    }

    function _tokenUpdated(address tokenAddress) internal {
        bool has = hasToken(tokenAddress);
        if (balanceOf(tokenAddress) > 0) {
            if (!has)
                tokenIndices[tokenAddress] = tokens.push(tokenAddress) - 1;
        } else if (has) {
            uint indexToDelete = tokenIndices[tokenAddress];
            address tokenToMove = tokens[tokens.length - 1];
            tokens[indexToDelete] = tokenToMove;
            tokens.length--;
        }
    }
}