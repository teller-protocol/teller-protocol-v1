// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/token.sol";

abstract contract ext_Token_v1 is sto_Token_v1 {
    /**
     * @notice It returns an array of token IDs owned by an address.
     * @dev It uses a EnumerableSet to store values and loops over each element to add to the array.
     * @dev Can be costly if calling within a contract for address with many tokens.
     */
    function ownedTokens(address owner)
        external
        view
        returns (uint256[] memory owned)
    {
        EnumerableSet.UintSet storage set = tokenStore().ownerTokenIDs[owner];
        owned = new uint256[](set.length());
        for (uint256 i; i < owned.length; i++) {
            owned[i] = set.at(i);
        }
    }
}
