// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract dat_Loans_v1 {
    address public constant PROTOCOL = address(0);
    uint256 internal constant SECONDS_PER_YEAR = 31536000;
}

abstract contract dat_Loans is dat_Loans_v1 {}
