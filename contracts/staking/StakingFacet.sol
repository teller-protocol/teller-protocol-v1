// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";
import { StakingStorageLib, StakingStorage } from "../storage/staking.sol";

// Contracts
import { TellerNFT } from "../nft/TellerNFT.sol";

// Utils
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract StakingFacet {
    function stakeNFT(uint256 nftId) external {
        _stakeNFT(nftId);
    }

    function stakeNFTs(uint256[] calldata nftIds) external {
        for (uint256 i; i < nftIds.length; i++) {
            _stakeNFT(nftIds[i]);
        }
    }

    function _stakeNFT(uint256 tokenId) internal {
        if (
            EnumerableSet.add(
                StakingStorageLib.store().stakedNFTs[msg.sender],
                tokenId
            )
        ) {
            // Transfer to diamond
            AppStorageLib.store().nft.transferFrom(
                msg.sender,
                address(this),
                tokenId
            );
            (, TellerNFT.Tier memory tier) =
                AppStorageLib.store().nft.getTokenTier(tokenId);
            StakingStorageLib.store().baseLoanSize[tokenId] = tier.baseLoanSize;
        }
    }
}
