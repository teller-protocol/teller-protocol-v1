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

    /**s
     * @notice it transfers the NFT from the sender to the diamond to stake then adds the NFTID to the list of the owner's stakedNFTs
     * @param nftID the ID of the NFT to stake
     * @param owner the owner of the NFT who will stake the NFT
     */
    function stake(uint256 nftID, address owner) internal {
        // Transfer to diamond
        NFTLib.nft().transferFrom(msg.sender, address(this), nftID);
        // Add NFT ID to user set
        EnumerableSet.add(s().stakedNFTs[owner], nftID);
    }

    /**
     * @notice it unstakes the NFT by removing the NFT ID from the list of the user's staked NFTs
     * @param nftID the ID of the NFT to remove from the list of the user's staked NFTs
     * @return success_ the boolean value telling us if the user has unsuccessfully unstaked the NFT
     */
    function unstake(uint256 nftID) internal returns (bool success_) {
        success_ = EnumerableSet.remove(s().stakedNFTs[msg.sender], nftID);
    }

    /**
     * @notice it gets the list of staked NFTs from the owner
     * @param nftOwner the owner of the staked NFTs to pull from
     * @return staked_ the array of the staked NFTs owned by the user
     */
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

    /**
     * @notice if the user fails to pay his loan, then we liquidate the all the NFTs associated with the loan
     * @param loanID the identifier of the loan to liquidate the NFTs from
     */
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

    /**
     * @notice it unstakes an NFT and verifies the proof in order to apply the proof to a loan
     * @param loanID the identifier of the loan
     * @param proof the proof to be attached to a loan after verifying the loan size
     */
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

    /**
     * @notice it finds the loan's NFTs and adds them back to the owner's list of staked NFTs
     * @param loanID the identifier of the respective loan to add the NFTs back to the user's staked NFTs
     * @param owner the owner to add the unstaked NFTs back to the staked pile
     */
    function restakeLinked(uint256 loanID, address owner) internal {
        // Get linked NFT
        EnumerableSet.UintSet storage nfts = s().loanNFTs[loanID];
        for (uint256 i; i < EnumerableSet.length(nfts); i++) {
            // Restake the NFT
            EnumerableSet.add(s().stakedNFTs[owner], EnumerableSet.at(nfts, i));
        }
    }

    /**
     * @notice it verifies the NFT id to base loan size using the merkle proof
     * @param proof the NFTLoanSizeProof to verify with the nft;s merkle root
     * @return verified_ tells us if the loan is verified or not
     */
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
