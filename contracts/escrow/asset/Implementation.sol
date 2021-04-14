// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import { AMetamorphic } from "./AssetEscrow.sol";

import "@openzeppelin/contracts/utils/introspection/IERC165.sol";

contract AssetEscrowV1 is AMetamorphic {
    function deposit(uint256 amount, bytes32 ident) external entrance {}

    function withdraw(uint256 amount, bytes32 ident) external entrance {}
}
