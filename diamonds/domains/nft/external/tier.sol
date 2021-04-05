// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/tier.sol";

contract ext_tier_NFT_v1 is sto_Tier {
    /**
     * @notice It returns information about a Tier for an index.
     */
    function getTier(uint256 tierIndex)
        external
        view
        returns (Tier memory tier_)
    {
        tier_ = tierStore().tiers[tierIndex];
    }

    /**
     * @notice It returns information about a Tier for a token ID.
     */
    function getTokenTier(uint256 tokenId)
        external
        view
        returns (uint256 index_, Tier memory tier_)
    {
        index_ = tierStore().tokenTierMap[tokenId];
        tier_ = tierStore().tiers[index_];
    }

    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function getTierHashes(uint256 tierIndex)
        external
        view
        returns (string[] memory hashes_)
    {
        hashes_ = tierStore().tiers[tierIndex].hashes;
    }
}

contract ext_tier_NFT is ext_tier_NFT_v1 {}
