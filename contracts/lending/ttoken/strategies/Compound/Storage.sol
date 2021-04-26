// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../shared/interfaces/ICErc20.sol";

struct Store {
    ICErc20 cToken;
    uint256 desiredRatioLocal;
}

bytes32 constant POSITION = keccak256(
    "teller.ttoken.strategy.compound.storage.position"
);

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}
