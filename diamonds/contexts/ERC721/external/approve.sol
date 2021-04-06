// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/ERC721.sol";
import { int_approve_ERC721_v1 } from "../internal/approve.sol";
import { int_exists_ERC721_v1 } from "../internal/exists.sol";

contract ext_approve_ERC721_v1 is
    sto_ERC721,
    int_exists_ERC721_v1,
    int_approve_ERC721_v1
{
    /**
     * @dev See {IERC721-getApproved}.
     */
    function getApproved(uint256 tokenId)
        external
        view
        virtual
        returns (address)
    {
        require(
            _exists(tokenId),
            "ERC721: approved query for nonexistent token"
        );

        return erc721Store().tokenApprovals[tokenId];
    }

    /**
     * @dev See {IERC721-isApprovedForAll}.
     */
    function isApprovedForAll(address owner, address operator)
        external
        view
        virtual
        returns (bool)
    {
        return _isApprovedForAll(owner, operator);
    }
}
