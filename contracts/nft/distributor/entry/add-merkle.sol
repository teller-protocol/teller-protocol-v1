// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";

// Utils
import { DistributorEvents, ADMIN, MerkleRoot } from "../data.sol";

contract ent_addMerkle_NFTDistributor_v1 is
    sto_NFTDistributor,
    mod_authorized_AccessControl_v1
{
    /**
     * @notice Adds a new merkle to be able to claim NFTs.
     * @param tierIndex Index of NFT tier to assign merkle for.
     * @param merkleRoot The merkle root to assign to the new tier.
     *
     * Requirements:
     *  - Caller must be an admin
     */
    function addMerkle(uint256 tierIndex, bytes32 merkleRoot)
        external
        authorized(ADMIN, msg.sender)
    {
        MerkleRoot storage merkle = distributorStore().merkleRoots.push();
        merkle.tierIndex = tierIndex;
        merkle.merkleRoot = merkleRoot;

        emit DistributorEvents.MerkleAdded(
            distributorStore().merkleRoots.length - 1
        );
    }
}
