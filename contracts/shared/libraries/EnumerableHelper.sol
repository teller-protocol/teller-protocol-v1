// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

library EnumerableHelper {
    // Bytes32Set

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function toArray(EnumerableSet.Bytes32Set storage set)
        internal
        view
        returns (bytes32[] memory arr_)
    {
        arr_ = set._inner._values;
    }

    // AddressSet

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function toArray(EnumerableSet.AddressSet storage set)
        internal
        view
        returns (address[] memory arr_)
    {
        arr_ = new address[](EnumerableSet.length(set));
        for (uint256 i; i < arr_.length; i++) {
            arr_[i] = EnumerableSet.at(set, i);
        }
    }

    // UintSet

    /**
     * @dev Add a value to a set. O(1).
     *
     * Returns true if the value was added to the set, that is if it was not
     * already present.
     */
    function toArray(EnumerableSet.UintSet storage set)
        internal
        view
        returns (uint256[] memory arr_)
    {
        arr_ = new uint256[](EnumerableSet.length(set));
        for (uint256 i; i < arr_.length; i++) {
            arr_[i] = EnumerableSet.at(set, i);
        }
    }
}
