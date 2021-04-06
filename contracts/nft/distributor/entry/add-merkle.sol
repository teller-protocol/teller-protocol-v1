// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";

// Utils
import { DistributorEvents, ADMIN } from "../data.sol";

contract ent_addMerkle_NFTDistributor_v1 is
    sto_NFTDistributor,
    mod_authorized_AccessControl_v1
{
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
        distributorStore().merkleRoots.push(newMerkleRoot);

        emit DistributorEvents.TierAdded(
            distributorStore().merkleRoots.length - 1
        );
    }
}
