// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TToken_V2_Alpha } from "../../lending/ttoken/TToken_V2_Alpha.sol";
import { TellerNFT } from "../TellerNFT.sol";

// Libraries
import { NFTLib } from "../libraries/NFTLib.sol";
import { LendingLib } from "../../lending/libraries/LendingLib.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MainnetNFTInterestFacet {
    // TELLER NFT V1
    TellerNFT private constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    /**
     * @notice It claims the interest earned by the caller's staked NFTs
     * @param assetAddress The address of the lending asset against which the NFTs are staked
     */
    function claimNFTInterest(address assetAddress) external {
        TToken_V2_Alpha(address(LendingLib.tToken(assetAddress)))
            .claimAlphaInterest(
                msg.sender,
                getClaimableInterestPercent(msg.sender)
            );
    }

    /**
     * @notice It returns the claimable interest % for a user's staked NFTs.
     * @param nftOwner The address of the NFT owner.
     */
    function getClaimableInterestPercent(address nftOwner)
        public
        view
        returns (uint16)
    {
        uint256 userNFTs = EnumerableSet.length(
            NFTLib.s().stakedNFTs[nftOwner]
        );
        uint256 diamondNFTs = TELLER_NFT_V1.balanceOf(address(this));
        return NumbersLib.ratioOf(userNFTs, diamondNFTs);
    }
}
