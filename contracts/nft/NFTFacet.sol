// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../nft/TellerNFT.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Libraries
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { NFTLib } from "./libraries/NFTLib.sol";

contract NFTFacet is RolesMods {
    /**
     * @notice Transfers Teller NFT to Diamond and applies user stake.
     * @param nftID The ID of a Teller NFT to stake.
     */
    function stakeNFT(uint256 nftID) public {
        // Stake NFT and transfer into diamond
        if (NFTLib.stake(nftID)) {
            // Transfer to diamond
            NFTLib.nft().transferFrom(msg.sender, address(this), nftID);
        }
    }

    function getStakedNFTs(address nftOwner)
        public
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
            stakeNFT(nftIDs[i]);
        }
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
