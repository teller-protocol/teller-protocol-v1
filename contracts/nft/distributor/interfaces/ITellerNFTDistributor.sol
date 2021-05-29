// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../ITellerNFT.sol";

// Utils
import { ClaimNFTRequest, MerkleRoot } from "../data.sol";

interface ITellerNFTDistributor {
    /**
     * @notice It gets the TellerNFT diamond instance used to mint.
     */
    function nft() external view returns (ITellerNFT _nft);

    /**
     * @notice It gets the merkle roots for NFTs it can distribute.
     */
    function getMerkleRoots()
        external
        view
        returns (MerkleRoot[] memory roots_);

    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param merkleIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     */
    function isClaimed(uint256 merkleIndex, uint256 nodeIndex)
        external
        view
        returns (bool _claimed);

    /**
     * @notice Claims TellerNFTs for a given verifiable merkle proofs for each tier.
     * @param account The address to claim NFTs on behalf.
     * @param requests An array requests data generated from the merkle tree.
     *
     * Requirements:
     *  - Node in the merkle root must not be claimed already
     *  - Proof of the node must match the merkle tree
     */
    function claim(address account, ClaimNFTRequest[] calldata requests)
        external;

    /**
     * @notice Adds a new merkle to be able to claim NFTs.
     * @param tierIndex Index of NFT tier to assign merkle for.
     * @param merkleRoot The merkle root to assign to the new tier.
     *
     * Requirements:
     *  - Caller must be an admin
     */
    function addMerkle(uint256 tierIndex, bytes32 merkleRoot) external;

    /**
     * @notice Sets a merkle to be able to claim NFTs.
     * @param index Index of merkle to set.
     * @param tierIndex Index of NFT tier to assign merkle for.
     *
     * Requirements:
     *  - Caller must be an admin
     */
    function moveMerkle(uint256 index, uint256 tierIndex) external;

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;

    function setNFTDictionaryAddress(address dictionary) external;

    /**
     * @notice Initializes the Distributor contract with the TellerNFT
     * @param _nft The address of the TellerNFT.
     * @param admin The address of an admin.
     */
    function initialize(address _nft, address admin) external;
}
