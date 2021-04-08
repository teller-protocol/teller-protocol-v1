// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

bytes32 constant ADMIN = keccak256("ADMIN");
bytes32 constant MINTER = keccak256("MINTER");

struct MerkleRoot {
    bytes32 merkleRoot;
    uint256 tierIndex;
}

struct ClaimNFTRequest {
    uint256 merkleIndex;
    uint256 nodeIndex;
    uint256 amount;
    bytes32[] merkleProof;
}

library DistributorEvents {
    event Claimed(address indexed account);

    event MerkleAdded(uint256 index);
}
