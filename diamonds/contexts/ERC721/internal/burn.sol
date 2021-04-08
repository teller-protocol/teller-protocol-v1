// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import { int_beforeTokenTransfer_ERC721_v1 } from "./before-token-transfer.sol";
import { int_approve_ERC721_v1 } from "./approve.sol";

// Utils
import { ERC721EventsLib } from "../data.sol";

abstract contract int_burn_ERC721_v1 is
    sto_ERC721,
    int_approve_ERC721_v1,
    int_beforeTokenTransfer_ERC721_v1
{
    /**
     * @dev Destroys `tokenId`.
     * The approval is cleared when the token is burned.
     *
     * Requirements:
     *
     * - `tokenId` must exist.
     *
     * Emits a {Transfer} event.
     */
    function _burn(uint256 tokenId) internal virtual {
        address owner = erc721Store().owners[tokenId];

        _beforeTokenTransfer(owner, address(0), tokenId);

        // Clear approvals
        _approve(address(0), tokenId);

        erc721Store().balances[owner] -= 1;
        delete erc721Store().owners[tokenId];

        emit ERC721EventsLib.Transfer(owner, address(0), tokenId);
    }
}
