// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../nft/TellerNFTDictionary.sol";

// Utils
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct NFTStorage {
    // Maps NFT owner to set of token IDs owned
    mapping(address => EnumerableSet.UintSet) stakedNFTs;
    // Maps loanID to NFT IDs indicating NFT being used for the loan
    mapping(uint256 => EnumerableSet.UintSet) loanNFTs;
    // Merkle root used for verifying nft IDs to base loan size
    TellerNFTDictionary nftDictionary;
}

bytes32 constant NFT_STORAGE_POS = keccak256("teller.staking.storage");

library NFTStorageLib {
    function store() internal pure returns (NFTStorage storage s) {
        bytes32 pos = NFT_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
