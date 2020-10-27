// This is just to be used as a LendingPool template for the gnosis Mock Contracts, until the LendingPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;

import "../../base/LendingPool.sol";

contract LendingPoolMock is LendingPool {

    bool public _mockRequireIsLoan;

    function mockRequireIsLoan(bool mock) external {
        _mockRequireIsLoan = mock;
    }

    function _requireIsLoan() internal {
        if(!_mockRequireIsLoan) {
            super._requireIsLoan();
        }
    }
}
