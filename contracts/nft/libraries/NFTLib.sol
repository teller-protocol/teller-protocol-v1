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

    function stake(uint256 nftID, address owner) internal {
        // Transfer to diamond
        NFTLib.nft().transferFrom(msg.sender, address(this), nftID);
        // Add NFT ID to user set
        EnumerableSet.add(s().stakedNFTs[owner], nftID);
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

    function liquidateNFT(uint256 loanID) internal {
        // Check if NFTs are linked
        EnumerableSet.UintSet storage nfts = s().loanNFTs[loanID];
        for (uint256 i; i < EnumerableSet.length(nfts); i++) {
            NFTLib.nft().transferFrom(
                address(this),
                AppStorageLib.store().nftLiquidationController,
                EnumerableSet.at(nfts, i)
            );
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

    function restakeLinked(uint256 loanID, address owner) internal {
        // Get linked NFT
        EnumerableSet.UintSet storage nfts = s().loanNFTs[loanID];
        for (uint256 i; i < EnumerableSet.length(nfts); i++) {
            // Restake the NFT
            EnumerableSet.add(s().stakedNFTs[owner], EnumerableSet.at(nfts, i));
        }
    }

    function verifyLoanSize(NftLoanSizeProof calldata proof)
        internal
        view
        returns (bool verified_)
    {
        verified_ = MerkleProof.verify(
            proof.proof,
            s().nftMerkleRoot,
            keccak256(abi.encodePacked(proof.id, proof.baseLoanSize))
        );
    }
}
