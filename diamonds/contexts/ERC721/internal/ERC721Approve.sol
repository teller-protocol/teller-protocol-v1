// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contrcats
import "../storage/ERC721.sol";
import "../data.sol";

abstract contract int_approve_ERC721_v1 is sto_ERC721, dat_ERC721 {
    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        erc721Store().tokenApprovals[tokenId] = to;
        emit Approval(erc721Store().owners[tokenId], to, tokenId);
    }
}
