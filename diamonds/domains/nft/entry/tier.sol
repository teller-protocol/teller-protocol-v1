// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../storage/tier.sol";

// Utils
import { Tier } from "../data/tier.sol";
import { MINTER } from "../roles.sol";

contract ent_tier_NFT_v1 is sto_Tier, mod_authorized_AccessControl_v1 {
    using Counters for Counters.Counter;

    /**
     * @notice Adds a new Tier to be minted with the given information.
     * @dev It auto increments the index of the next tier to add.
     * @param newTier Information about the new tier to add.
     *
     * Requirements:
     *  - Caller must have the {MINTER} role
     */
    function addTier(Tier memory newTier)
        external
        authorized(MINTER, msg.sender)
    {
        Tier storage tier =
            tierStore().tiers[tierStore().tierCounter.current()];

        tier.baseLoanSize = newTier.baseLoanSize;
        tier.hashes = newTier.hashes;
        tier.contributionAsset = newTier.contributionAsset;
        tier.contributionSize = newTier.contributionSize;
        tier.contributionMultiplier = newTier.contributionMultiplier;

        tierStore().tierCounter.increment();
    }
}

contract ent_tier_NFT is ent_tier_NFT_v1 {}
