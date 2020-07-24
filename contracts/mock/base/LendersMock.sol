pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/Lenders.sol";

/**
    This contract is created ONLY for testing purposes.
 */
contract LendersMock is Lenders {
    
    /** State Variables */

    bool public addressesEqual;

    /** Constructor */

    /** External Functions */

    function mockLenderInfo(
        address lender,
        uint256 timeLastAccrued,
        uint256 totalNotWithdrawn,
        uint256 totalAccruedInterest
    ) external {
        accruedInterest[lender].timeLastAccrued = timeLastAccrued;
        accruedInterest[lender].totalAccruedInterest = totalAccruedInterest;
        accruedInterest[lender].totalNotWithdrawn = totalNotWithdrawn;
    }

    function mockAddressesEqual(bool addressesEqualValue) external {
        addressesEqual = addressesEqualValue;
    }

    /** Internal Functions */

    function _areAddressesEqual(address, address)
        internal
        view
        returns (bool)
    {
        return addressesEqual;
    }
}
