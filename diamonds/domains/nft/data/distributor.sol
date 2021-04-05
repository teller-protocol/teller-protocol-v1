// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

library DistributorEvents {
    event Claimed(uint256 index, address account, uint256 amount);

    event TierAdded(uint256 index);
}
