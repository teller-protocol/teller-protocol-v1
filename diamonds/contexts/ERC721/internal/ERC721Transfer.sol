// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import "../data.sol";
import "./ERC721BeforeTokenTransfer.sol";
import "./ERC721Approve.sol";

abstract contract int_ERC721Transfer_v1 is
    int_beforeTokenTransfer_ERC721_v1,
    int_approve_ERC721_v1
{
    /**
     * @dev Transfers `tokenId` from `from` to `to`.
     *  As opposed to {transferFrom}, this imposes no restrictions on msg.sender.
     *
     * Requirements:
     *
     * - `to` cannot be the zero address.
     * - `tokenId` token must be owned by `from`.
     *
     * Emits a {Transfer} event.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual {
        require(
            sto_ERC721.erc721Store().owners[tokenId] == from,
            "ERC721: transfer of token that is not own"
        );
        require(to != address(0), "ERC721: transfer to the zero address");

        _beforeTokenTransfer(from, to, tokenId);

        // Clear approvals from the previous owner
        _approve(address(0), tokenId);

        sto_ERC721.erc721Store().balances[from] -= 1;
        sto_ERC721.erc721Store().balances[to] += 1;
        sto_ERC721.erc721Store().owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }
}
