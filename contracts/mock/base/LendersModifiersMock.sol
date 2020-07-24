pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Lenders.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract LendersModifiersMock is Lenders {

    /** Constructor */

    /** External Functions */

    function externalIsZToken() isZToken() external {}

    function externalIsLendingPool() isLendingPool() external {}

    function externalIsValid(address anAddress) isValid(anAddress) external {}

}
