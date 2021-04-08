// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";

contract ext_balanceOf_ERC721_v1 is sto_ERC721 {
    /**
     * @dev See {IERC721-balanceOf}.
     */
    function balanceOf(address owner) external view virtual returns (uint256) {
        require(
            owner != address(0),
            "ERC721: balance query for the zero address"
        );
        return erc721Store().balances[owner];
    }
}
