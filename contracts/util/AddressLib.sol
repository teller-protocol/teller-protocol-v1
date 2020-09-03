pragma solidity 0.5.17;

/**
 * @dev Utility library of inline functions on addresses
 *
 * @author develop@teller.finance
 */
library AddressLib {
    address public constant ADDRESS_EMPTY = address(0x0);

    /**
     * @dev Checks if this address is all 0s
     * @param self The address this function was called on
     * @return boolean
     */
    function isEmpty(address self) internal pure returns (bool) {
        return self == ADDRESS_EMPTY;
    }

    /**
     * @dev Checks if this address is the same as another address
     * @param self The address this function was called on
     * @param other Address to check against itself
     * @return boolean
     */
    function isEqualTo(address self, address other) internal pure returns (bool) {
        return self == other;
    }

    /**
     * @dev Checks if this address is different to another address
     * @param self The address this function was called on
     * @param other Address to check against itself
     * @return boolean
     */
    function isNotEqualTo(address self, address other) internal pure returns (bool) {
        return self != other;
    }

    /**
     * @dev Checks if this address is not all 0s
     * @param self The address this function was called on
     * @return boolean
     */
    function isNotEmpty(address self) internal pure returns (bool) {
        return self != ADDRESS_EMPTY;
    }

    /**
     * @dev Throws an error if address is all 0s
     * @param self The address this function was called on
     * @param message Error message if address is all 0s
     */
    function requireNotEmpty(address self, string memory message) internal pure {
        require(isNotEmpty(self), message);
    }

    /**
     * @dev Throws an error if address is not all 0s
     * @param self The address this function was called on
     * @param message Error message if address is not all 0s
     */
    function requireEmpty(address self, string memory message) internal pure {
        require(isEmpty(self), message);
    }

    /**
     * @dev Throws an error if address is not the same as another address
     * @param self The address this function was called on
     * @param other The address to check against itself
     * @param message Error message if addresses are not the same
     */
    function requireEqualTo(
        address self,
        address other,
        string memory message
    ) internal pure {
        require(isEqualTo(self, other), message);
    }

    /**
     * @dev Throws an error if address is the same as another address
     * @param self The address this function was called on
     * @param other The address to check against itself
     * @param message Error message if addresses are the same
     */
    function requireNotEqualTo(
        address self,
        address other,
        string memory message
    ) internal pure {
        require(isNotEqualTo(self, other), message);
    }
}
