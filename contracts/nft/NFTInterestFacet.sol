// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { NFTFacet } from "./NFTFacet.sol";

// Libraries
import { NFTLib } from "./libraries/NFTLib.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";

contract NFTInterestFacet is NFTFacet {
    /**
     * @notice It returns the claimable interest % for a user's staked NFTs.
     * @param nftOwner The address of the NFT owner.
     */
    function getClaimableInterestPercent(address nftOwner)
        external
        view
        returns (uint16 claimableInterestPercent)
    {
        uint256[] memory stakedNFTs = NFTLib.stakedNFTs(nftOwner);
        uint256[] memory diamondNFTs = NFTLib.nft().getOwnedTokens(
            address(this)
        );
        claimableInterestPercent = NumbersLib.ratioOf(
            stakedNFTs.length,
            diamondNFTs.length
        );
    }
}
