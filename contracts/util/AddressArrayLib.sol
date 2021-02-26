pragma solidity 0.5.17;

import "./AddressLib.sol";

/**
    @notice Utility library of inline functions on the address arrays.

    @author develop@teller.finance
 */
library AddressArrayLib {
    using AddressLib for address;

    /**
        @notice This struct manages an array of addresses of the library instance.
        @param array An array of address values.
        @param indices A mapping of unit256 values mapped to addresses.
     */
    struct AddressArray {
        address[] array;
        mapping(address => uint256) indices;
    }

    /**
        @notice It returns the length of an array
        @param self The current array
    */
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
        return self.push(newItem) - 1;
    }

    /**
      @notice It adds an address value to the array.
      @param self current array.
      @param addr new address to add.
      @return index the item was added to.
    */
    function add(AddressArray storage self, address addr)
        internal
        returns (uint256)
    {
        (bool found, uint256 index) = getIndex(self, addr);
        if (!found) {
            index = add(self.array, addr);
            self.indices[addr] = index;
        }

        return index;
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

        self.length--;
    }

    /**
      @notice It removes an address value from the array.
      @param self the current array.
      @param index the index of the address to remove.
    */
    function remove(AddressArray storage self, uint256 index) internal {
        removeAt(self.array, index);
    }

    /**
      @notice It removes an address value from the array.
      @param self the current array.
      @param addr the address to remove.
    */
    function remove(AddressArray storage self, address addr) internal {
        (bool found, uint256 index) = getIndex(self, addr);

        if (!found) return;

        removeAt(self.array, index);
    }

    /**
      @notice It gets the index for a given item.
      @param self the current array.
      @param item to get the index.
      @return indexAt the current index for a given item.
      @return found true if the item was found. Otherwise it returns false.
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

    /**
      @notice It gets the index for a given item.
      @param self the current array.
      @param addr to get the index for.
      @return found true if the item was found. Otherwise it returns false.
      @return index the current index for a given address.
    */
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
      @return the current array without the removed item.
    */
    function remove(address[] storage self, address item) internal {
        (bool found, uint256 indexAt) = getIndex(self, item);
        if (!found) return;

        removeAt(self, indexAt);
    }
}
