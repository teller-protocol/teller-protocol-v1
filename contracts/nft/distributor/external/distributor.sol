// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";
import "../internal/distributor.sol";

contract ext_distributor_NFT_v1 is sto_NFTDistributor, int_distributor_NFT_v1 {
    /**
     * @notice It gets the TellerNFT diamond instance used to mint.
     * @return nft_ return the NFT instance
     */
    function nft() external view returns (ITellerNFT nft_) {
        nft_ = distributorStore().nft;
    }

    /**
     * @notice It gets the merkle roots for NFTs it can distribute.
     * @return roots_ returns the merkle
     */
    function getMerkleRoots()
        external
        view
        returns (MerkleRoot[] memory roots_)
    {
        roots_ = distributorStore().merkleRoots;
    }

    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param merkleIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     * @return claimed_ returns a boolean to check if the tier has already been claimed
     */
    function isClaimed(uint256 merkleIndex, uint256 nodeIndex)
        external
        view
        returns (bool claimed_)
    {
        claimed_ = _isClaimed(merkleIndex, nodeIndex);
    }
}

contract ext_distributor_NFT is ext_distributor_NFT_v1 {}
