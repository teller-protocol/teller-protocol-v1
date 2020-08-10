pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Lenders.sol";


/**
    This contract is created ONLY for testing purposes.
 */
contract LendersModifiersMock is Lenders {
    /** Constructor */

    /** External Functions */

    function externalIsZToken() external isZToken() {}

    function externalIsLendingPool() external isLendingPool() {}

    function externalIsValid(address anAddress) external isValid(anAddress) {}
}
