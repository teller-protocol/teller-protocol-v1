// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/distributor.sol";
import "../../../contexts/initializable/modifiers/initializer.sol";
import "../../../contexts/access-control/modifiers/authorized.sol";
import "../../../contexts/access-control/entry/grant-role.sol";
import "../../../contexts/access-control/entry/revoke-role.sol";
import "../internal/distributor.sol";
import { ADMIN } from "../data.sol";

// Interfaces
import "../interfaces/ITellerNFT.sol";

// Libraries
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "../../../contexts/access-control/entry/renounce-role.sol";

contract ent_distributor_NFT_v1 is
    sto_Distributor,
    mod_initializer_Initializable_v1,
    mod_authorized_AccessControl_v1,
    ent_grantRole_AccessControl,
    ent_revokeRole_AccessControl,
    ent_renounceRole_AccessControl,
    int_distributor_NFT_v1
{
    event Claimed(uint256 index, address account, uint256 amount);

    event TierAdded(uint256 index);

    function claim(
        uint256 tierIndex,
        uint256 index,
        address account,
        uint256 amount,
        bytes32[] calldata merkleProof
    ) external {
        require(!_isClaimed(tierIndex, index), "Teller: NFT already claimed.");

        // Verify the merkle proof.
        bytes32 node = keccak256(abi.encodePacked(index, account, amount));
        require(
            MerkleProof.verify(
                merkleProof,
                distributorStore().tierMerkleRoots[tierIndex],
                node
            ),
            "Teller: Invalid proof."
        );

        // Mark it claimed and send the token.
        _setClaimed(tierIndex, index);
        for (uint256 i; i < amount; i++) {
            distributorStore().nft.mint(tierIndex, account);
        }

        emit Claimed(index, account, amount);
    }

    function addTier(bytes32 merkleRoot)
        external
        authorized(ADMIN, msg.sender)
    {
        distributorStore().tierMerkleRoots.push(merkleRoot);

        emit TierAdded(distributorStore().tierMerkleRoots.length - 1);
    }

    function initialize(address nft) external initializer {
        distributorStore().nft = ITellerNFT(nft);

        _grantRole(ADMIN, msg.sender);
    }
}
