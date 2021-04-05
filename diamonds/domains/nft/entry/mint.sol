// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/tier.sol";
import "../internal/set-owner.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../../../contexts/ERC721/internal/ERC721Mint.sol";
import { MINTER } from "../data.sol";

abstract contract ent_Mint_v1 is
    mod_authorized_AccessControl_v1,
    sto_Tier,
    int_SetOwner_v1,
    int_ERC721Mint_v1
{
    function mint(uint256 tierIndex, address owner)
        external
        authorized(MINTER, msg.sender)
    {
        // Get the new token ID
        Counters.Counter storage counter =
            erc721Store().tierTokenCounter[tierIndex];
        uint256 tokenId = counter.current();
        counter.increment();

        // Mint and set the token to the tier index
        _safeMint(owner, tokenId);
        erc721Store().tokenTierMap[tokenId] = tierIndex;

        // Set owner
        _setOwner(owner, tokenId);
    }
}
