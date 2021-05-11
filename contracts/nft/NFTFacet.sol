// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../nft/TellerNFT.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../shared/roles.sol";

// Libraries
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { NFTLib } from "./libraries/NFTLib.sol";
import { RolesLib } from "../contexts2/access-control/roles/RolesLib.sol";

contract NFTFacet is RolesMods {
    function getStakedNFTs(address nftOwner)
        public
        view
        returns (uint256[] memory staked_)
    {
        staked_ = NFTLib.stakedNFTs(nftOwner);
    }

    /**
     * @notice Transfers multiple Teller NFTs to Diamond and applies user stake.
     * @param nftIDs IDs of Teller NFTs to stake.
     */
    function stakeNFTs(uint256[] calldata nftIDs) external {
        for (uint256 i; i < nftIDs.length; i++) {
            // Stake NFT and transfer into diamond
            NFTLib.stake(nftIDs[i], msg.sender);
        }
        // Give the caller authorization to protocol
        RolesLib.grantRole(AUTHORIZED, msg.sender);
    }

    /**
     * @notice Sets a merkle root that is used to verify an NFT ID to its predetermined base loan size.
     * @param merkleRoot New merkle root to use.
     *
     * Requirements:
     *  - Sender must have `ADMIN` role
     */
    function setNFTMerkleRoot(bytes32 merkleRoot)
        external
        authorized(ADMIN, msg.sender)
    {
        NFTLib.s().nftMerkleRoot = merkleRoot;
    }
}
