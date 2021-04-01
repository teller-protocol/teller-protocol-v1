// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./AddressLib.sol";

/**
    @notice Utility library of inline functions on the address arrays.

    @author develop@teller.finance
 */
library AddressArrayLib {
    using AddressLib for address;

    struct AddressArray {
        address[] array;
        mapping(address => uint256) indices;
    }

    function length(AddressArray storage self) internal view returns (uint256) {
        return self.array.length;
    }

    /**
      @notice It adds an address value to the array.
      @param self current array.
      @param newItem new item to add.
      @return index the item was added to.
    */
    function add(address[] storage self, address newItem)
        internal
        returns (uint256)
    {
        newItem.requireNotEmpty("EMPTY_ADDRESS_NOT_ALLOWED");
        self.push(newItem);
        return self.length - 1;
    }

    function add(AddressArray storage self, address addr)
        internal
        returns (uint256 index)
    {
        addr.requireNotEmpty("EMPTY_ADDRESS_NOT_ALLOWED");
        (bool found, ) = getIndex(self, addr);
        require(!found, "ADDRESS_EXISTS");
        self.array.push(addr);
        index = length(self) - 1;
        self.indices[addr] = index;
    }

    /**
      @notice It removes the value at the given index in an array.
      @param self the current array.
      @param index remove an item in a specific index.
    */
    function removeAt(address[] storage self, uint256 index) internal {
        if (index >= self.length) return;

        if (index != self.length - 1) {
            self[index] = self[self.length - 1];
        }

        self.pop();
    }

    function remove(AddressArray storage self, uint256 index) internal {
        removeAt(self.array, index);
    }

    function remove(AddressArray storage self, address addr) internal {
        (bool found, uint256 index) = getIndex(self, addr);

        if (!found) return;

        removeAt(self.array, index);
    }

    /**
      @notice It gets the index for a given item.
      @param self the current array.
      @param item to get the index.
      @return found true if the item was found. Otherwise it returns false.
      @return indexAt the current index for a given item.
    */
    function getIndex(address[] storage self, address item)
        internal
        view
        returns (bool found, uint256 indexAt)
    {
        for (indexAt = 0; indexAt < self.length; indexAt++) {
            found = self[indexAt] == item;
            if (found) {
                return (found, indexAt);
            }
        }
        return (found, indexAt);
    }

    function getIndex(AddressArray storage self, address addr)
        internal
        view
        returns (bool found, uint256 index)
    {
        if (self.array.length > 0) {
            index = self.indices[addr];
            found = self.array[index] == addr;
        }
    }

    /**
      @notice It removes an address value from the array.
      @param self the current array.
      @param item the item to remove.
    */
    function remove(address[] storage self, address item) internal {
        (bool found, uint256 indexAt) = getIndex(self, item);
        if (!found) return;

        removeAt(self, indexAt);
    }
}
