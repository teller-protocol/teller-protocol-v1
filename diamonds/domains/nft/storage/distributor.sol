// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "../interfaces/ITellerNFT.sol";

contract sto_Distributor {
    struct DistributorStorage {
        ITellerNFT nft;
        bytes32[] tierMerkleRoots;
        mapping(uint256 => mapping(uint256 => uint256)) claimedBitMap;
    }

    function distributorStore()
        internal
        pure
        returns (DistributorStorage storage s)
    {
        bytes32 POSITION = keccak256("teller_nft.distributor");
        assembly {
            s.slot := POSITION
        }
    }
}
