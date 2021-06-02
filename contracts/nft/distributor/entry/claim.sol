// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../store.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";

import "../internal/distributor.sol";

// Utils
import { ClaimNFTRequest, ADMIN, DistributorEvents } from "../data.sol";

contract ent_claim_NFTDistributor_v1 is
    sto_NFTDistributor,
    int_distributor_NFT_v1,
    mod_authorized_AccessControl_v1
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
    function claim(address account, ClaimNFTRequest[] calldata requests)
        external
    {
        for (uint256 i; i < requests.length; i++) {
            require(
                !_isClaimed(requests[i].merkleIndex, requests[i].nodeIndex),
                "TellerNFT Distributor: already claimed"
            );
            require(
                _verifyProof(account, requests[i]),
                "TellerNFT Distributor: invalid proof"
            );

            // Mark it claimed and send the token.
            _setClaimed(requests[i].merkleIndex, requests[i].nodeIndex);
            uint256 tierIndex =
                distributorStore().merkleRoots[requests[i].merkleIndex]
                    .tierIndex;
            for (uint256 j; j < requests[i].amount; j++) {
                distributorStore().nft.mint(tierIndex, account);
            }

            //Find the newly minted tokens and add to memory
            uint256[] memory postOwnedTokens =
                distributorStore().nft.getOwnedTokens(account);

            uint256[] memory newlyMintedTokenIds =
                new uint256[](requests[i].amount);

            uint256 offset = postOwnedTokens.length - requests[i].amount;

            for (uint256 k; k < requests[i].amount; k++) {
                newlyMintedTokenIds[k] = postOwnedTokens[k + offset];
            }

            //For each newly minted token, set the tier index in the Dictionary contract
            distributorStore().dictionary.setTokenTierForTokenIds(
                newlyMintedTokenIds,
                tierIndex
            );
        }

        emit DistributorEvents.Claimed(account);
    }

    function setNFTDictionaryAddress(address dictionary)
        external
        authorized(ADMIN, msg.sender)
    {
        distributorStore().dictionary = TellerNFTDictionary(dictionary);
    }
}
