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
import {
    ClaimNFTTierRequest,
    DistributorEvents
} from "../../data/distributor.sol";

// Interfaces
import "../../interfaces/ITellerNFT.sol";

import "hardhat/console.sol";

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
     * @notice Claims TellerNFTs for a given verifiable merkle proofs for each tier.
     * @param account The address to claim NFTs on behalf.
     * @param requests An array requests data generated from the merkle tree.
     *
     * Requirements:
     *  - Node in the merkle root must not be claimed already
     *  - Proof of the node must match the merkle tree
     */
    function claim(address account, ClaimNFTTierRequest[] calldata requests)
        external
    {
        for (uint256 i; i < requests.length; i++) {
            console.log(i, requests[i].tierIndex, requests[i].nodeIndex);
            console.log(
                _isClaimed(requests[i].tierIndex, requests[i].nodeIndex)
            );
            require(
                !_isClaimed(requests[i].tierIndex, requests[i].nodeIndex),
                "Distributor: already claimed"
            );
            require(
                _verifyProof(account, requests[i]),
                "Distributor: invalid proof"
            );

            // Mark it claimed and send the token.
            _setClaimed(requests[i].tierIndex, requests[i].nodeIndex);
            for (uint256 j; j < requests[i].amount; j++) {
                distributorStore().nft.mint(requests[i].tierIndex, account);
            }
        }

        emit DistributorEvents.Claimed(account);
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
     * @param admin The address of an admin.
     */
    function initialize(address _nft, address admin) external initializer {
        distributorStore().nft = ITellerNFT(_nft);

        _grantRole(ADMIN, admin);
    }
}

contract ent_distributor_NFT is ent_distributor_NFT_v1 {}
