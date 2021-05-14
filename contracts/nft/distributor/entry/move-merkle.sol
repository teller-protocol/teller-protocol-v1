// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";

// Utils
import { DistributorEvents, ADMIN, MerkleRoot } from "../data.sol";

contract ent_moveMerkle_NFTDistributor_v1 is
    sto_NFTDistributor,
    mod_authorized_AccessControl_v1
{
    /**
     * @notice Change a merkle to be for a different tier to be able to claim NFTs.
     * @param index Index of merkle to set.
     * @param tierIndex Index of NFT tier to assign merkle for.
     *
     * Requirements:
     *  - Caller must be an admin
     */
    function moveMerkle(uint256 index, uint256 tierIndex)
        external
        authorized(ADMIN, msg.sender)
    {
        MerkleRoot storage merkle = distributorStore().merkleRoots[index];
        merkle.tierIndex = tierIndex;
    }
}
