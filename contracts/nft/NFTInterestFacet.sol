// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { NFTFacet } from "./NFTFacet.sol";

// Libraries
import { NFTLib } from "./libraries/NFTLib.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

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
        uint256 userNFTs = EnumerableSet.length(
            NFTLib.s().stakedNFTs[nftOwner]
        );
        uint256 diamondNFTs = NFTLib.nft().balanceOf(address(this));
        claimableInterestPercent = NumbersLib.ratioOf(userNFTs, diamondNFTs);
    }
}
