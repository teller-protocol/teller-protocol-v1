// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../../storage/distributor.sol";
import "../../../../contexts/initializable/modifiers/initializer.sol";
import "../../../../contexts/access-control/modifiers/authorized.sol";
import "../../../../contexts/access-control/entry/grant-role.sol";
import "../../../../contexts/access-control/entry/revoke-role.sol";
import "../../../../contexts/access-control/entry/renounce-role.sol";
import "../../internal/distributor.sol";

// Utils
import { ADMIN } from "../../roles.sol";
import { DistributorEvents } from "../../data/distributor.sol";

// Interfaces
import "../../interfaces/ITellerNFT.sol";

// Libraries
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract ent_distributor_NFT_v1 is
    sto_Distributor,
    mod_initializer_Initializable_v1,
    mod_authorized_AccessControl_v1,
    ent_grantRole_AccessControl,
    ent_revokeRole_AccessControl,
    ent_renounceRole_AccessControl,
    int_distributor_NFT_v1
{
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
    ) external {
        require(
            !_isClaimed(tierIndex, nodeIndex),
            "Distributor: already claimed"
        );

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(nodeIndex, account, amount));
        require(
            MerkleProof.verify(
                merkleProof,
                distributorStore().tierMerkleRoots[tierIndex],
                node
            ),
            "Distributor: invalid proof"
        );

        // Mark it claimed and send the token.
        _setClaimed(tierIndex, nodeIndex);
        for (uint256 i; i < amount; i++) {
            distributorStore().nft.mint(tierIndex, account);
        }

        emit DistributorEvents.Claimed(nodeIndex, account, amount);
    }

    /**
     * @notice Adds a new tier to be able to claim NFTs.
     * @param newMerkleRoot The merkle root to assign to the new tier.
     *
     * Requirements:
     *  - Caller must be an admin
     *  - Tier must already be added to TellerNFT
     */
    function addTier(bytes32 newMerkleRoot)
        external
        authorized(ADMIN, msg.sender)
    {
        bytes32[] storage merkleRoots = distributorStore().tierMerkleRoots;
        require(
            distributorStore()
                .nft
                .getTier(merkleRoots.length)
                .contributionAsset != address(0),
            "Distributor: tier does not exist on NFT"
        );
        merkleRoots.push(newMerkleRoot);

        emit DistributorEvents.TierAdded(
            distributorStore().tierMerkleRoots.length - 1
        );
    }

    /**
     * @notice Initializes the Distributor contract with the TellerNFT
     * @param _nft The address of the TellerNFT.
     */
    function initialize(address _nft) external initializer {
        distributorStore().nft = ITellerNFT(_nft);

        _grantRole(ADMIN, msg.sender);
    }
}

contract ent_distributor_NFT is ent_distributor_NFT_v1 {}
