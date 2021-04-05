// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct ClaimNFTTierRequest {
    uint256 tierIndex;
    uint256 nodeIndex;
    uint256 amount;
    bytes32[] merkleProof;
}

library DistributorEvents {
    event Claimed(address indexed account);

    event TierAdded(uint256 index);
}
