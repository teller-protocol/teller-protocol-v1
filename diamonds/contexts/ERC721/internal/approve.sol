// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import { int_exists_ERC721_v1 } from "./exists.sol";

// Utils
import { ERC721EventsLib } from "../data.sol";

abstract contract int_approve_ERC721_v1 is sto_ERC721, int_exists_ERC721_v1 {
    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {Approval} event.
     */
    function _approve(address to, uint256 tokenId) internal virtual {
        erc721Store().tokenApprovals[tokenId] = to;
        emit ERC721EventsLib.Approval(
            erc721Store().owners[tokenId],
            to,
            tokenId
        );
    }

    /**
     * @dev Approve `to` to operate on `tokenId`
     *
     * Emits a {ApprovalForAll} event.
     */
    function _setApprovalForAll(address operator, bool approved)
        internal
        virtual
    {
        erc721Store().operatorApprovals[msg.sender][operator] = approved;
        emit ERC721EventsLib.ApprovalForAll(msg.sender, operator, approved);
    }

    /**
     * @dev Returns whether `spender` is allowed to manage `tokenId`.
     *
     * Requirements:
     * - `tokenId` must exist.
     */
    function _isApprovedOrOwner(address spender, uint256 tokenId)
        internal
        view
        virtual
        returns (bool)
    {
        require(
            _exists(tokenId),
            "ERC721: operator query for nonexistent token"
        );
        address owner = erc721Store().owners[tokenId];
        return (spender == owner ||
            erc721Store().tokenApprovals[tokenId] == spender ||
            erc721Store().operatorApprovals[owner][spender]);
    }

    /**
     * @dev Returns whether `operator` is allowed to manage all of `owner` tokens.
     */
    function _isApprovedForAll(address owner, address operator)
        internal
        view
        virtual
        returns (bool)
    {
        return erc721Store().operatorApprovals[owner][operator];
    }
}
