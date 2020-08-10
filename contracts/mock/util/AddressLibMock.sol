pragma solidity 0.5.17;

import "../../util/AddressLib.sol";


contract AddressLibMock {
    using AddressLib for address;

    string public constant REQUIRE_NOT_EMPTY_ERROR_MESSAGE = "ADDRESS_MUST_BE_PROVIDED";
    string public constant REQUIRE_EMPTY_ERROR_MESSAGE = "ADDRESS_MUST_BE_EMPTY";
    string public constant REQUIRE_EQUAL_TO_ERROR_MESSAGE = "ADDRESSES_MUST_BE_EQUAL";
    string public constant REQUIRE_NOT_EQUAL_TO_ERROR_MESSAGE = "ADDRESSES_MUST_NOT_BE_EQUAL";

    function isEmpty(address self) external pure returns (bool) {
        return self.isEmpty();
    }

    function isEqualTo(address left, address right) external pure returns (bool) {
        return left.isEqualTo(right);
    }

    function isNotEqualTo(address left, address right) external pure returns (bool) {
        return left.isNotEqualTo(right);
    }

    function isNotEmpty(address self) external pure returns (bool) {
        return self.isNotEmpty();
    }

    function requireNotEmpty(address self) external pure {
        self.requireNotEmpty(REQUIRE_NOT_EMPTY_ERROR_MESSAGE);
    }

    function requireEmpty(address self) external pure {
        self.requireEmpty(REQUIRE_EMPTY_ERROR_MESSAGE);
    }

    function requireEqualTo(address left, address right) external pure {
        left.requireEqualTo(right, REQUIRE_EQUAL_TO_ERROR_MESSAGE);
    }

    function requireNotEqualTo(address left, address right) external pure {
        left.requireNotEqualTo(right, REQUIRE_NOT_EQUAL_TO_ERROR_MESSAGE);
    }
}
