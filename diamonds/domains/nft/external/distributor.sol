// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/distributor.sol";
import "../internal/distributor.sol";

contract ext_distributor_NFT_v1 is sto_Distributor, int_distributor_NFT_v1 {
    function getTierMerkleRoots() external view returns (bytes32[] memory) {
        return distributorStore().tierMerkleRoots;
    }

    function isClaimed(uint256 tierIndex, uint256 index)
        external
        view
        returns (bool)
    {
        return _isClaimed(tierIndex, index);
    }
}
