// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import "@openzeppelin/contracts/utils/Counters.sol";

abstract contract sto_Tier_v1 {
    bytes32 internal constant POSITION = keccak256("teller_nft.tier");

    struct Tier {
        uint256 baseLoanSize;
        string[] hashes;
        address contributionAsset;
        uint256 contributionSize;
        uint8 contributionMultiplier;
    }

    struct TierStorage {
        // It holds the total number of tiers.
        Counters.Counter tierCounter;
        // It holds the total number of tokens minted for a tier.
        mapping(uint256 => Counters.Counter) tierTokenCounter;
        // It holds the information about a tier.
        mapping(uint256 => Tier) tiers;
        // It holds which tier a token ID is in.
        mapping(uint256 => uint256) tokenTierMap;
    }

    function tierStore() internal pure returns (TierStorage storage s) {
        bytes32 position = POSITION;
        assembly {
            s.slot := position
        }
    }
}
