// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../ITellerNFT.sol";
import "../TellerNFTDictionary.sol";

// Utils
import { MerkleRoot } from "./data.sol";

abstract contract sto_NFTDistributor {
    struct DistributorStorage {
        ITellerNFT nft;
        MerkleRoot[] merkleRoots;
        mapping(uint256 => mapping(uint256 => uint256)) claimedBitMap;
        TellerNFTDictionary dictionary;
    }

    bytes32 constant POSITION = keccak256("teller_nft.distributor");

    function distributorStore()
        internal
        pure
        returns (DistributorStorage storage s)
    {
        bytes32 P = POSITION;
        assembly {
            s.slot := P
        }
    }
}
