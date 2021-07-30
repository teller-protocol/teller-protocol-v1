// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { NFTFacet } from "./NFTFacet.sol";

// Libraries
import { NFTLib } from "./libraries/NFTLib.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";

contract NFTInterestFacet is NFTFacet {
    // TELLER NFT V1
    TellerNFT private constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    /**
     * @notice It claims the interest earned by the caller's staked NFTs
     * @param assetAddress The address of the lending asset against which the NFTs are staked
     */
    function claimNFTInterest(address assetAddress) external {
        uint16 claimableInterestPercent = NFTLib
            .calculateClaimableInterestPercent(msg.sender);
        LendingLib.tToken(assetAddress).claimAlphaInterest(
            msg.sender,
            claimableInterestPercent
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
        return NFTLib.calculateClaimableInterestPercent(nftOwner);
    }
}
