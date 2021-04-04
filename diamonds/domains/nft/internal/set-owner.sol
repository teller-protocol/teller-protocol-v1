// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/tier.sol";
import "../../../contexts/ERC721/storage/ERC721.sol";
import "../storage/token.sol";

// Libraries
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract int_SetOwner_v1 is sto_ERC721_v1, sto_Token_v1 {
    using EnumerableSet for EnumerableSet.UintSet;

    /**
     * @notice It removes the token from the current owner set and adds to new owner.
     */
    function _setOwner(address newOwner, uint256 tokenId) internal {
        address currentOwner = erc721Store().owners[tokenId];
        if (currentOwner != address(0)) {
            tokenStore().ownerTokenIDs[currentOwner].remove(tokenId);
        }
        tokenStore().ownerTokenIDs[newOwner].add(tokenId);
    }
}
