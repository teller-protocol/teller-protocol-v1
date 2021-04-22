// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

abstract contract Ticketed {
    bytes32 public constant TICKETED_STORAGE_SLOT =
        keccak256("eip9876.ticketed.storage.slot");

    modifier ticketed(bytes32 id, address account) {
        _;
        bytes32 position = TICKETED_STORAGE_SLOT;
        assembly {
            mstore(0, position)
            mstore(0x20, id)
            sstore(keccak256(0, 0x40), account)
        }
    }

    function tickets(bytes32 id) public view virtual returns (address owner_) {
        bytes32 position = TICKETED_STORAGE_SLOT;
        assembly {
            mstore(0, position)
            mstore(0x20, id)
            owner_ := sload(keccak256(0, 0x40))
        }
    }
}
