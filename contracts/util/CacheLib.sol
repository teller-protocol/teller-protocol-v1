pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "./AddressLib.sol";

/**
    @notice Utility library of inline functions on the Cache struct.

    @author develop@teller.finance
 */
library CacheLib {
    using AddressLib for address;
    using Address for address;

    /**
        @notice This struct manages the cache of the library instance.
        @param addresses A mapping of address values mapped to cache keys in bytes. 
        @param uints A mapping of uint values mapped to cache keys names in bytes.
        @param ints A mapping of int values mapped to cache keys names in bytes.
        @param bites A mapping of bytes values mapped to cache keys names in bytes.
        @param bools A mapping of bool values mapped to cache keys names in bytes.
     */

    struct Cache {
        // Mapping of cache keys names to address values.
        mapping(bytes32 => address) addresses;
        // Mapping of cache keys names to uint256 values.
        mapping(bytes32 => uint256) uints;
        // Mapping of cache keys names to int256 values.
        mapping(bytes32 => int256) ints;
        // Mapping of cache keys names to bytes32 values.
        mapping(bytes32 => bytes32) bites;
        // Mapping of cache keys names to bool values.
        mapping(bytes32 => bool) bools;
    }

    /**
        @notice The constant for the initialization check
     */
    bytes32 private constant INITIALIZED = keccak256("Initialized");

    /**
        @notice Initializes the cache instance.
        @param self The current cache
     */
    function initialize(Cache storage self) 
        internal
    {
        requireNotExists(self);
        self.bools[INITIALIZED] = true;
    }

    /**
        @notice Checks whether the current cache does not, throwing an error if it does.
        @param self The current cache
     */
    function requireNotExists(Cache storage self)
        internal
        view
    {
        require(!exists(self), "CACHE_ALREADY_EXISTS");
    }

    /**
        @notice Checks whether the current cache exists, throwing an error if the cache does not.
        @param self The current cache
     */
    function requireExists(Cache storage self)
        internal
        view
    {
        require(exists(self), "CACHE_DOES_NOT_EXIST");
    }

    /**
        @notice Tests whether the current cache exists or not.
        @param self The current cache.
        @return bool True if the cache exists.
     */
    function exists(Cache storage self)
        internal
        view
        returns (bool)
    {
        return self.bools[INITIALIZED];
    }

    /**
        @notice Updates the address value for a given key name.
        @param self The current cache
        @param key The key for which the address value is being updated.
        @param newAddress The new address being set.
     */
    function updateAddress(
        Cache storage self,
        bytes32 key,
        address newAddress
    )
        internal
    {
        requireExists(self);
        require(
            self.addresses[key] != newAddress,
            "NEW_ADDRESS_REQUIRED"
        );
        self.addresses[key] = newAddress;
    }

    /**
        @notice Retrieves the address value for a given key name.
        @param self The current cache
        @param key The key for which the address value is being retrieved.
        @return The stored address value.
     */
    function getAddress(
        Cache storage self,
        bytes32 key
    )
        internal
        view
        returns (address)
    {
        requireExists(self);
        return self.addresses[key];
    }

    /**
        @notice Updates the uint value for a given key name.
        @param self The current cache
        @param key The key for which the uint value is being updated.
        @param newValue The new value being set.
     */
    function updateUint(
        Cache storage self,
        bytes32 key,
        uint256 newValue
    )
        internal
    {
        requireExists(self);
        require(
            self.uints[key] != newValue,
            "NEW_UINT_REQUIRED"
        );
        self.uints[key] = newValue;
    }

    /**
        @notice Retrieves the uint value for a given key name.
        @param self The current cache
        @param key The key for which the uint value is being retrieved.
        @return The stored uint256 value.
     */
    function getUint(
        Cache storage self,
        bytes32 key
    )
        internal
        view
        returns (uint256)
    {
        requireExists(self);
        return self.uints[key];
    }

    /**
        @notice Tests whether a given uint value is greater than the current stored value for a given key.
        @param self The current cache
        @param key The key for which the uint value is being updated.
        @param amount The value being tested.
        @return bool True if the value exceed the stored value.
     */
    function exceedsUint(
        Cache storage self,
        bytes32 key,
        uint256 amount
    )
        internal
        view
        returns (bool)
    {
        requireExists(self);
        return amount > self.uints[key];
    }

    /**
        @notice Updates the int value for a given key name.
        @param self The current cache
        @param key The key for which the int value is being updated.
        @param newValue The new value being set.
     */
    function updateInt(
        Cache storage self,
        bytes32 key,
        int256 newValue
    )
        internal
    {
        requireExists(self);
        require(
            self.ints[key] != newValue,
            "NEW_INT_REQUIRED"
        );
        self.ints[key] = newValue;
    }

    /**
        @notice Retrieves the int value for a given key name.
        @param self The current cache
        @param key The key for which the int value is being requested.
        @return The stored in256 value.
     */
    function getInt(
        Cache storage self,
        bytes32 key
    )
        internal
        view
        returns (int256)
    {
        requireExists(self);
        return self.ints[key];
    }

    /**
        @notice Updates the bytes value for a given key name.
        @param self The current cache
        @param key The key for which the bytes value is being updated.
        @param newBites The new value being set.
     */
    function updateBites(
        Cache storage self,
        bytes32 key,
        bytes32 newBites
    )
        internal
    {
        requireExists(self);
        require(
            self.bites[key] != newBites,
            "NEW_BYTES_REQUIRED"
        );
        self.bites[key] = newBites;
    }

    /**
        @notice Retrieves the bytes value for a given key name.
        @param self The current cache
        @param key The key for which the bytes value is being retrieved.
        @return The stored bytes32 value.
     */
    function getBites(
        Cache storage self,
        bytes32 key
    )
        internal
        returns (bytes32)
    {
        requireExists(self);
        return self.bites[key];
    }

    /**
        @notice Updates the bool value for a given key name.
        @param self The current cache
        @param key The key for which the bool value is being updated.
        @param newBool The new value being set.
     */
    function updateBool(Cache storage self, bytes32 key, bool newBool)
        internal
    {
        requireExists(self);
        require(
            self.bools[key] != newBool,
            "NEW_BOOLEAN_REQUIRED"
        );
        self.bools[key] = newBool;
    }

    /**
        @notice Retrieves the bool value for a given key name.
        @param self The current cache
        @param key The key for which the bool value is being retrieved.
        @return The stored boolean value.
     */
    function getBool(
        Cache storage self,
        bytes32 key
    )
        internal
        view
        returns (bool)
    {
        requireExists(self);
        return self.bools[key];
    }

}