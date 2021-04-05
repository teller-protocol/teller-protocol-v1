// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "./ITellerNFT.sol";

interface ITellerNFTDistributor {
    /**
     * @notice It gets the TellerNFT diamond instance used to mint.
     */
    function nft() external view returns (ITellerNFT _nft);

    /**
     * @notice It gets the merkle roots for each tier it can distribute NFTs.
     */
    function getTierMerkleRoots()
        external
        view
        returns (bytes32[] memory _roots);

    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param tierIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     */
    function isClaimed(uint256 tierIndex, uint256 nodeIndex)
        external
        view
        returns (bool _claimed);

    /**
     * @notice Claims TellerNFTs for a given tier index and node index in the merkle root.
     * @param tierIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     * @param account The address to claim their NFT.
     * @param amount The amount of NFTs that {account} is allowed to claim.
     * @param merkleProof The proof of the merkle for the given parameters above.
     *
     * Requirements:
     *  - Node in the merkle root must not be claimed already
     *  - Proof of the node must match the merkle tree
     */
    function claim(
        uint256 tierIndex,
        uint256 nodeIndex,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external;

    /**
     * @notice Adds a new tier to be able to claim NFTs.
     * @param newMerkleRoot The merkle root to assign to the new tier.
     *
     * Requirements:
     *  - Caller must be an admin
     *  - Tier must already be added to TellerNFT
     */
    function addTier(bytes32 newMerkleRoot) external;

    function grantRole(bytes32 role, address account) external;

    function revokeRole(bytes32 role, address account) external;

    function renounceRole(bytes32 role, address account) external;

    /**
     * @notice Initializes the Distributor contract with the TellerNFT
     * @param _nft The address of the TellerNFT.
     */
    function initialize(address _nft) external;
}
