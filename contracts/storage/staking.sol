// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Utils
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct StakingStorage {
    // Maps NFT owner to set of token IDs owned
    mapping(address => EnumerableSet.UintSet) stakedNFTs;
    // Maps loanID to NFT IDs indicating NFT being used for the loan
    mapping(uint256 => EnumerableSet.UintSet) loanNFTs;
    mapping(uint256 => uint256) baseLoanSize;
}

bytes32 constant STAKING_STORAGE_POS = keccak256("teller.staking.storage");

library StakingStorageLib {
    function store() internal pure returns (StakingStorage storage s) {
        bytes32 pos = STAKING_STORAGE_POS;
        assembly {
            s.slot := pos
        }
    }
}
