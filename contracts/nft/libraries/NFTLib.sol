// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../TellerNFT.sol";

// Libraries
import {
    MerkleProof
} from "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { RolesLib } from "../contexts2/access-control/roles/RolesLib.sol";

// Storage
import { AppStorageLib, AppStorage } from "../../storage/app.sol";
import { NFTStorageLib, NFTStorage } from "../../storage/nft.sol";

struct NftLoanSizeProof {
    uint256 id;
    uint256 baseLoanSize;
    bytes32[] proof;
}

library NFTLib {
    function s() internal pure returns (NFTStorage storage s_) {
        s_ = NFTStorageLib.store();
    }

    function nft() internal view returns (TellerNFT nft_) {
        nft_ = AppStorageLib.store().nft;
    }

    function stake(uint256 nftID) internal returns (bool success_) {
        // Add NFT ID to user set - returns true if added
        success_ = EnumerableSet.add(s().stakedNFTs[msg.sender], nftID);
        // Check if user has authorization and add the staker if not
        if (!RolesLib.hasRole(AUTHORIZED, msg.sender)) {
            RolesLib.grantRole(AUTHORIZED, msg.sender);
        }
    }

    function unstake(uint256 nftID) internal returns (bool success_) {
        success_ = EnumerableSet.remove(s().stakedNFTs[msg.sender], nftID);
    }

    function stakedNFTs(address nftOwner)
        internal
        view
        returns (uint256[] memory staked_)
    {
        EnumerableSet.UintSet storage nfts = s().stakedNFTs[nftOwner];
        staked_ = new uint256[](EnumerableSet.length(nfts));
        for (uint256 i; i < staked_.length; i++) {
            staked_[i] = EnumerableSet.at(nfts, i);
        }
    }

    function applyToLoan(uint256 loanID, NftLoanSizeProof calldata proof)
        internal
    {
        // NFT must be currently staked
        // Remove NFT from being staked - returns bool
        require(unstake(proof.id), "Teller: borrower nft not staked");

        require(verifyLoanSize(proof), "Teller invalid nft proof");

        // Apply NFT to loan
        EnumerableSet.add(s().loanNFTs[loanID], proof.id);
    }

    function verifyLoanSize(NftLoanSizeProof calldata proof)
        internal
        returns (bool verified_)
    {
        verified_ = MerkleProof.verify(
            proof.proof,
            s().nftMerkleRoot,
            keccak256(abi.encodePacked(proof.id, proof.baseLoanSize))
        );
    }
}
