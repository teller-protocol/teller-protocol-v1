// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/ERC721/storage/ERC721.sol";
import {
    int_transfer_ERC721
} from "../../../contexts/ERC721/internal/transfer.sol";
import { int_setOwner_NFT } from "./set-owner.sol";

abstract contract int_Transfer_v1 is
    sto_ERC721,
    int_transfer_ERC721,
    int_setOwner_NFT
{
    /**
     * @dev It updates the list of user owned tokens and then calls ERC721 internal transfer.
     * @dev See {ERC721-_transfer}.
     */
    function _transfer(
        address from,
        address to,
        uint256 tokenId
    ) internal override {
        _setOwner(to, tokenId);
        super._transfer(from, to, tokenId);
    }
}
