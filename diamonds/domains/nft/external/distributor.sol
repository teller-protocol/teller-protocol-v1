// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/distributor.sol";
import "../internal/distributor.sol";

contract ext_distributor_NFT_v1 is sto_Distributor, int_distributor_NFT_v1 {
    /**
     * @notice It gets the TellerNFT diamond instance used to mint.
     */
    function nft() external view returns (ITellerNFT nft_) {
        nft_ = distributorStore().nft;
    }

    /**
     * @notice It gets the merkle roots for each tier it can distribute NFTs.
     */
    function getTierMerkleRoots()
        external
        view
        returns (bytes32[] memory roots_)
    {
        roots_ = distributorStore().tierMerkleRoots;
    }

    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param tierIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     */
    function isClaimed(uint256 tierIndex, uint256 nodeIndex)
        external
        view
        returns (bool claimed_)
    {
        claimed_ = _isClaimed(tierIndex, nodeIndex);
    }
}

contract ext_distributor_NFT is ext_distributor_NFT_v1 {}
