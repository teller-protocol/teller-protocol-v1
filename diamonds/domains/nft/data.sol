pragma solidity ^0.8.0;

bytes32 constant MINTER = keccak256("MINTER");

struct Tier {
    uint256 baseLoanSize;
    string[] hashes;
    address contributionAsset;
    uint256 contributionSize;
    uint8 contributionMultiplier;
}
