// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

bytes32 constant POSITION = keccak256(
    "teller.context.initializable.storage.position"
);

struct Store {
    bool initialized;
    bool initializing;
}

function store() pure returns (Store storage s_) {
    bytes32 position = POSITION;
    assembly {
        s_.slot := position
    }
}

// Taken from @openzeppelin/contracts/proxy/utils/Initializable.sol
abstract contract Initializable {
    /**
     * @dev Modifier to protect an initializer function from being invoked twice.
     */
    modifier initializer() {
        require(
            store().initializing || !store().initialized,
            "Initializable: contract is already initialized"
        );

        bool isTopLevelCall = !store().initializing;
        if (isTopLevelCall) {
            store().initializing = true;
            store().initialized = true;
        }

        _;

        if (isTopLevelCall) {
            store().initializing = false;
        }
    }
}
