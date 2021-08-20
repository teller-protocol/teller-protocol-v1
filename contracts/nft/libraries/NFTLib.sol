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

library NFTLib {
    function s() internal pure returns (NFTStorage storage s_) {
        s_ = NFTStorageLib.store();
    }

    function nft() internal view returns (TellerNFT nft_) {
        nft_ = AppStorageLib.store().nft;
    }

    /**s
     * @notice Adds the {nftID} to the list of the owner's stakedNFTs
     * @param nftID the ID of the NFT to stake
     * @param owner the owner of the NFT who will stake the NFT
     */
    function stake(uint256 nftID, address owner) internal {
        // Add NFT ID to user set
        EnumerableSet.add(s().stakedNFTs[owner], nftID);
    }

    /**
     * @notice Adds the {nftID} to the list of the owner's stakedNFTs
     * @param nftID the ID of the NFT to stake
     * @param amount the quantity of ERC1155 NFT to stake
     * @param owner the owner of the NFT who will stake the NFT
     */
    function stakeV2(
        uint256 nftID,
        uint256 amount,
        address owner
    ) internal {
        // Add NFT ID and quantity to user set
        s().stakedNFTsV2Amounts[owner][nftID] += amount;
        EnumerableSet.add(s().stakedNFTsV2[owner], nftID);
    }

    /**
     * @notice it unstakes the NFT by removing the NFT ID from the list of the user's staked NFTs
     * @param nftID the ID of the NFT to remove from the list of the user's staked NFTs
     * @param owner the account which originally staked the NFT
     * @return success_ the boolean value telling us if the user has unsuccessfully unstaked the NFT
     */
    function unstake(uint256 nftID, address owner)
        internal
        returns (bool success_)
    {
        success_ = EnumerableSet.remove(s().stakedNFTs[owner], nftID);
    }

    /**
     * @notice it unstakes the NFT by removing the NFT ID from the list of the user's staked NFTs
     * @param nftID the ID of the NFT to remove from the list of the user's staked NFTs
     * @param amount the quantity of ERC1155 NFT to unstake
     * @return success_ the boolean value telling us if the user has unsuccessfully unstaked the NFT
     */
    function unstakeV2(
        uint256 nftID,
        uint256 amount,
        address owner
    ) internal returns (bool success_) {
        // Check if owner has the staked balance
        success_ = s().stakedNFTsV2Amounts[owner][nftID] >= amount;

        // Subtract the amount from owner's staked balance
        if (success_) {
            s().stakedNFTsV2Amounts[owner][nftID] -= amount;

            // If the staked token balance is now 0, remove the ID from mapping
            if (s().stakedNFTsV2Amounts[owner][nftID] == 0) {
                EnumerableSet.remove(s().stakedNFTsV2[owner], nftID);
            }
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
     * @notice It unstakes an NFT and verifies the proof in order to apply the proof to a loan
     * @param loanID the identifier of the loan
     * @param nftID the NFT ID to apply to the loan
     * @param owner the account which originally staked the NFT
     */
    function applyToLoan(
        uint256 loanID,
        uint256 nftID,
        address owner
    ) internal {
        // NFT must be currently staked
        // Remove NFT from being staked - returns bool
        require(unstake(nftID, owner), "Teller: borrower nft not staked");

        // Apply NFT to loan
        EnumerableSet.add(s().loanNFTs[loanID], nftID);
    }

    /**
     * @notice it unstakes an NFT and verifies the proof in order to apply the proof to a loan
     * @param loanID the identifier of the loan
     * @param nftID the NFT ID to apply to the loan
     */
    function applyToLoanV2(
        uint256 loanID,
        uint256 nftID,
        uint256 amount,
        address borrower
    ) internal {
        // NFT must be currently staked
        // Remove NFT from being staked - returns bool
        require(
            unstakeV2(nftID, amount, borrower),
            "Teller: borrower nft not staked"
        );

        // Apply NFT to loan
        EnumerableSet.add(s().loanNFTsV2[loanID], nftID);
        s().loanNFTsV2Amounts[loanID][nftID] = amount;
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
     * @notice it finds the loan's NFTs and adds them back to the owner's list of staked NFTs
     * @param loanID the identifier of the respective loan to add the NFTs back to the user's staked NFTs
     * @param owner the owner to add the unstaked NFTs back to the staked pile
     */
    function restakeLinkedV2(uint256 loanID, address owner) internal {
        // Get linked NFT
        EnumerableSet.UintSet storage loanNFTs = s().loanNFTsV2[loanID];
        for (uint256 i; i < EnumerableSet.length(loanNFTs); i++) {
            uint256 nftV2ID = EnumerableSet.at(loanNFTs, i);

            // Make sure NFT ID is staked
            EnumerableSet.add(s().stakedNFTsV2[owner], nftV2ID);

            // Increment the staked amount from amount linked to loan
            s().stakedNFTsV2Amounts[owner][nftV2ID] += s().loanNFTsV2Amounts[
                loanID
            ][nftV2ID];
        }
    }
}
