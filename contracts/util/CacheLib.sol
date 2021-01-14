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

//   enum CacheType { Address, Uint, Int, Byte, Bool }

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
//   bytes32 private constant INITIALIZED = keccak256("Initialized");

  /**
        @notice Initializes the cache instance.
        @param self The current cache
     */
  function initialize(Cache storage self) internal {
    requireNotExists(self);
    self.bools[keccak256("Initialized")] = true;
  }

  /**
        @notice Checks whether the current cache does not, throwing an error if it does.
        @param self The current cache
     */
  function requireNotExists(Cache storage self) internal view {
    require(!exists(self), "CACHE_ALREADY_EXISTS");
  }

  /**
        @notice Checks whether the current cache exists, throwing an error if the cache does not.
        @param self The current cache
     */
  function requireExists(Cache storage self) internal view {
    require(exists(self), "CACHE_DOES_NOT_EXIST");
  }

  /**
        @notice Tests whether the current cache exists or not.
        @param self The current cache.
        @return bool True if the cache exists.
     */
  function exists(Cache storage self) internal view returns (bool) {
    return self.bools[keccak256("Initialized")];
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
  ) internal {
    requireExists(self);
    require(self.addresses[key] != newAddress, "NEW_ADDRESS_REQUIRED");
    self.addresses[key] = newAddress;
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
  ) internal {
    requireExists(self);
    require(self.uints[key] != newValue, "NEW_UINT_REQUIRED");
    self.uints[key] = newValue;
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
  ) internal view returns (bool) {
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
  ) internal {
    requireExists(self);
    require(self.ints[key] != newValue, "NEW_INT_REQUIRED");
    self.ints[key] = newValue;
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
  ) internal {
    requireExists(self);
    require(self.bites[key] != newBites, "NEW_BYTES_REQUIRED");
    self.bites[key] = newBites;
  }

  /**
        @notice Updates the bool value for a given key name.
        @param self The current cache
        @param key The key for which the bool value is being updated.
        @param newBool The new value being set.
     */
  function updateBool(
    Cache storage self,
    bytes32 key,
    bool newBool
  ) internal {
    requireExists(self);
    require(self.bools[key] != newBool, "NEW_BOOLEAN_REQUIRED");
    self.bools[key] = newBool;
  }

  /**
   */
//   function clearCache(
//     Cache storage self,
//     bytes32[5] memory keysToClear,
//     CacheType[5] memory keyTypes
//   ) internal {
//     requireExists(self);
//     require(keysToClear.length == keyTypes.length, "ARRAY_LENGTHS_MISMATCH");
//     for (uint256 i; i <= keysToClear.length; i++) {
//       if (keyTypes[i] == CacheType.Address) {
//         delete self.addresses[keysToClear[i]];
//       } else if (keyTypes[i] == CacheType.Uint) {
//         delete self.uints[keysToClear[i]];
//       } else if (keyTypes[i] == CacheType.Int) {
//         delete self.ints[keysToClear[i]];
//       } else if (keyTypes[i] == CacheType.Byte) {
//         delete self.bites[keysToClear[i]];
//       } else if (keyTypes[i] == CacheType.Bool) {
//         delete self.bools[keysToClear[i]];
//       }
//     }
//   }
}
