// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

abstract contract sto_Token {
    bytes32 internal constant POSITION = keccak256("teller_nft.token");

    struct TokenStorage {
        // It holds a set of token IDs for an owner address.
        mapping(address => EnumerableSet.UintSet) ownerTokenIDs;
    }

    function tokenStore() internal pure returns (TokenStorage storage s) {
        bytes32 position = POSITION;
        assembly {
            s.slot := position
        }
    }
}
