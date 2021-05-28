// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";

// Libraries
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

// Utils
import { ClaimNFTRequest } from "../data.sol";

contract int_distributor_NFT_v1 is sto_NFTDistributor {
    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param merkleIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     */
    function _setClaimed(uint256 merkleIndex, uint256 nodeIndex) internal {
        uint256 claimedWordIndex = nodeIndex / 256;
        uint256 claimedBitIndex = nodeIndex % 256;
        distributorStore().claimedBitMap[merkleIndex][claimedWordIndex] =
            distributorStore().claimedBitMap[merkleIndex][claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param merkleIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     * @return claimed_ returns a boolean to check if the tier has already been claimed
     */
    function _isClaimed(uint256 merkleIndex, uint256 nodeIndex)
        internal
        view
        returns (bool)
    {
        uint256 claimedWordIndex = nodeIndex / 256;
        uint256 claimedBitIndex = nodeIndex % 256;
        uint256 claimedWord =
            distributorStore().claimedBitMap[merkleIndex][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }

    /**
     * @notice it verifies the request's merkle proof with the merkle root in order to claim an NFT
     * @param account the account's address to be hashed and verified with the claim
     * @param request the request with the merkle proof to verify
     */
    function _verifyProof(address account, ClaimNFTRequest memory request)
        internal
        view
        returns (bool verified)
    {
        verified = MerkleProof.verify(
            request.merkleProof,
            distributorStore().merkleRoots[request.merkleIndex].merkleRoot,
            keccak256(
                abi.encodePacked(request.nodeIndex, account, request.amount)
            )
        );
    }
}
