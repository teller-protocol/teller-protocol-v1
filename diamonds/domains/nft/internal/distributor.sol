// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../storage/distributor.sol";

contract int_distributor_NFT_v1 is sto_Distributor {
    function _setClaimed(uint256 tierIndex, uint256 index) internal {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        distributorStore().claimedBitMap[tierIndex][claimedWordIndex] =
            distributorStore().claimedBitMap[tierIndex][claimedWordIndex] |
            (1 << claimedBitIndex);
    }

    function _isClaimed(uint256 tierIndex, uint256 index)
        internal
        view
        returns (bool)
    {
        uint256 claimedWordIndex = index / 256;
        uint256 claimedBitIndex = index % 256;
        uint256 claimedWord =
            distributorStore().claimedBitMap[tierIndex][claimedWordIndex];
        uint256 mask = (1 << claimedBitIndex);
        return claimedWord & mask == mask;
    }
}
