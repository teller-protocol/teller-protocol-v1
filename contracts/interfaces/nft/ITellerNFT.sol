// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
pragma experimental ABIEncoderV2;

interface ITellerNFT {
    struct Tier {
        uint256 baseLoanSize;
        string[] hashes;
        address contributionAsset;
        uint256 contributionSize;
        uint8 contributionMultiplier;
    }
}
