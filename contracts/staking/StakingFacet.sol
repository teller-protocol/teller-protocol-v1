// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib, AppStorage } from "../storage/app.sol";
import { StakingStorageLib, StakingStorage } from "../storage/staking.sol";

// Contracts
import "../nft/TellerNFT.sol";

// Utils
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract StakingFacet {
    using EnumerableSet for EnumerableSet.UintSet;

    function stakeNFT(uint256 nftId) external {
        _stakeNFT(nftId);
    }

    function stakeNFTs(uint256[] calldata nftIds) external {
        for (uint256 i; i < nftIds.length; i++) {
            _stakeNFT(nftIds[i]);
        }
    }

    function _stakeNFT(uint256 tokenId) internal {
        TellerNFT nft = AppStorageLib.store().nft;
        require(
            nft.ownerOf(tokenId) == msg.sender,
            "Teller Staking: not owner"
        );

        EnumerableSet.UintSet storage set =
            StakingStorageLib.store().stakedNFTs[msg.sender];
        if (!set.contains(tokenId)) {
            set.add(tokenId);
            // transfer
        }
    }
}
