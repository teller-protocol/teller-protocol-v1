// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

struct Store {
    string symbol;
    uint8 decimals;
    string name;
    uint256 totalSupply;
    mapping(address => uint256) balances;
    mapping(address => mapping(address => uint256)) allowances;
}

bytes32 constant POSITION = keccak256("teller.context.erc20.storage.position");

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}

// function symbol() view returns (string memory) {
//     return store().symbol;
// }

// function name() view returns (string memory) {
//     return store().name;
// }

// function decimals() view returns (uint8) {
//     return store().decimals;
// }

// function totalSupply() view returns (uint256) {
//     return store().totalSupply;
// }
