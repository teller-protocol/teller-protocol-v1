// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../storage/tier.sol";
import { MINTER, Tier } from "../data.sol";

contract ent_tier_NFT_v1 is mod_authorized_AccessControl_v1 {
    using Counters for Counters.Counter;

    function addTier(Tier memory newTier)
        external
        authorized(MINTER, msg.sender)
    {
        Tier storage tier =
            sto_Tier.tierStore().tiers[
                sto_Tier.tierStore().tierCounter.current()
            ];
        require(
            tier.contributionAsset == address(0),
            "Teller: tier already exists"
        );

        tier.baseLoanSize = newTier.baseLoanSize;
        tier.hashes = newTier.hashes;
        tier.contributionAsset = newTier.contributionAsset;
        tier.contributionSize = newTier.contributionSize;
        tier.contributionMultiplier = newTier.contributionMultiplier;

        sto_Tier.tierStore().tierCounter.increment();
    }
}
