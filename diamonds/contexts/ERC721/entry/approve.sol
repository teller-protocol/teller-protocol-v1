// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import "../internal/approve.sol";

contract ent_approve_ERC721_v1 is sto_ERC721, int_approve_ERC721_v1 {
    /**
     * @dev See {IERC721-approve}.
     */
    function approve(address to, uint256 tokenId) external virtual {
        address owner = erc721Store().owners[tokenId];
        require(to != owner, "ERC721: approval to current owner");

        require(
            msg.sender == owner || _isApprovedForAll(owner, msg.sender),
            "ERC721: approve caller is not owner nor approved for all"
        );

        _approve(to, tokenId);
    }

    /**
     * @dev See {IERC721-setApprovalForAll}.
     */
    function setApprovalForAll(address operator, bool approved)
        external
        virtual
    {
        require(operator != msg.sender, "ERC721: approve to caller");

        _setApprovalForAll(operator, approved);
    }
}
