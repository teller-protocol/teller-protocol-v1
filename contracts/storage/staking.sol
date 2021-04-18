// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Utils
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

struct StakingStorage {
    mapping(address => EnumerableSet.UintSet) stakedNFTs;
    // nftID mapped to loanID (linked when loan is created with submitted terms)
    mapping(uint256 => uint256) nftLinkedLoans;
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
