// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../../ITellerNFT.sol";

// Utils
import { ClaimNFTRequest, MerkleRoot } from "../data.sol";

interface ITellerNFTDistributor {
    /**
     * @notice It gets the TellerNFT diamond instance used to mint.
     * @return _nft returns the TellerNFT diamond instance
     */
    function nft() external view returns (ITellerNFT _nft);

    /**
     * @notice It gets the merkle roots for NFTs it can distribute.
     * @return roots_ the returned merkle roots
     */
    function getMerkleRoots()
        external
        view
        returns (MerkleRoot[] memory roots_);

    /**
     * @notice It checks the merkle root for a tier if it has already been claimed.
     * @param merkleIndex Index of the tier.
     * @param nodeIndex Index of the node in the merkle root.
     * @return _claimed returns a boolean to check if the tier has already been claimed
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

    /**
     * @notice it grants either an ADMIN or a MINTER role into an account
     * @param role the role to be granted to an account
     * @param account the account address
     */
    function grantRole(bytes32 role, address account) external;

    /**
     * @notice it removes either an ADMIN or a MINTER role from an account
     * @param role the role to be granted to an account
     * @param account the account address
     */
    function revokeRole(bytes32 role, address account) external;

    /**
     * @notice Grants an address a new role.
     * @param role the role to revoke for the account
     * @param account the address of the respective account to revoke
     */
    function renounceRole(bytes32 role, address account) external;

    function setNFTDictionaryAddress(address dictionary) external;

    /**
     * @notice Initializes the Distributor contract with the TellerNFT
     * @param _nft The address of the TellerNFT.
     * @param admin The address of an admin.
     */
    function initialize(
        address _nft,
        address _dictionary,
        address admin
    ) external;
}
