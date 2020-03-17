pragma solidity 0.5.17;

/**
 * Utility library of inline functions on addresses
 */
library AddressLib {
    address public constant ADDRESS_EMPTY = address(0x0);

    function isEmpty(address self) internal pure returns (bool) {
        return self == ADDRESS_EMPTY;
    }

    function  isEqualTo(address self, address other) internal pure returns (bool) {
        return self == other;
    }

    function isNotEqualTo(address self, address other)
        internal
        pure
        returns (bool)
    {
        return self != other;
    }

    function isNotEmpty(address self) internal pure returns (bool) {
        return self != ADDRESS_EMPTY;
    }

    function requireNotEmpty(address self, string memory message)
        internal
        pure
    {
        require(isNotEmpty(self), message);
    }

    function requireEmpty(address self, string memory message)
        internal
        pure
    {
        require(isEmpty(self), message);
    }

    function requireEqualTo(address self, address other, string memory message)
        internal
        pure
    {
        require(isEqualTo(self, other), message);
    }

    function requireNotEqualTo(
        address self,
        address other,
        string memory message
    ) internal pure {
        require(isNotEqualTo(self, other), message);
    }
}
