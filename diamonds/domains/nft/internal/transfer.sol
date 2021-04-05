// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/ERC721/storage/ERC721.sol";
import "../../../contexts/ERC721/internal/ERC721Transfer.sol";
import "./set-owner.sol";

abstract contract int_Transfer_v1 is
    sto_ERC721,
    int_ERC721Transfer_v1,
    int_SetOwner_v1
{
    /**
     * @dev It calls ERC721 internal transfer and then updates the user's sets.
     * @dev See {IERC721-transferFrom}.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        super._transfer(from, to, tokenId);
        _setOwner(to, tokenId);
    }
}
