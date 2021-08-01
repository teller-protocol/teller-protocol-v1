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
    // Maps NFT owner to set of token IDs owned (V2)
    mapping(address => EnumerableSet.UintSet) stakedNFTsV2;
    // Map NFT ids to amounts
    mapping(address => mapping(uint256 => uint256)) stakedNFTsV2Amounts;
    // Maps loanID to NFT IDs indicating NFT being used for the loan (V2)
    mapping(uint256 => EnumerableSet.UintSet) loanNFTsV2;
    // Map NFT ids to amounts, linked to loans
    mapping(uint256 => mapping(uint256 => uint256)) loanNFTsV2Amounts;
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
