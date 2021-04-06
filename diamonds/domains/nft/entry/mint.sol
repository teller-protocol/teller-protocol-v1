// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/tier.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import { int_setOwner_NFT } from "../internal/set-owner.sol";
import { int_mint_ERC721_v1 } from "../../../contexts/ERC721/internal/mint.sol";
import { MINTER } from "../roles.sol";

// Libraries
import "@openzeppelin/contracts/utils/Counters.sol";

contract ent_mint_NFT_v1 is
    mod_authorized_AccessControl_v1,
    sto_Tier,
    int_setOwner_NFT,
    int_mint_ERC721_v1
{
    using Counters for Counters.Counter;

    /**
     * @notice It mints a new token for a Tier index.
     *
     * Requirements:
     *  - Caller must be an authorized minter
     */
    function mint(uint256 tierIndex, address owner)
        external
        authorized(MINTER, msg.sender)
    {
        // Get the new token ID
        uint256 tokenId = tierStore().tokenCounter.current();
        tierStore().tokenCounter.increment();

        // Mint and set the token to the tier index
        _safeMint(owner, tokenId);
        tierStore().tokenTierMap[tokenId] = tierIndex;

        // Set owner
        _setOwner(owner, tokenId);
    }
}

contract ent_mint_NFT is ent_mint_NFT_v1 {}
