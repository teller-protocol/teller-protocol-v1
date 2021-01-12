// This is just to be used as a LendingPool template for the gnosis Mock Contracts, until the LendingPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../../base/LendingPool.sol";

contract LendingPoolMock is LendingPool {
    bool public _mockRequireIsLoan;

    function mockRequireIsLoan(bool mock) external {
        _mockRequireIsLoan = mock;
    }

    function _requireIsLoan() internal view {
        if (!_mockRequireIsLoan) {
            super._requireIsLoan();
        }
    }

    function mockMarketState(uint256 totalSupplied, uint256 totalRepaid, uint256 totalBorrowed) external {
        marketState.totalSupplied = totalSupplied;
        marketState.totalRepaid = totalRepaid;
        marketState.totalBorrowed = totalBorrowed;
    }

    function mockCompoundMarketState(uint256 totalSupplied, uint256 totalRepaid, uint256 totalBorrowed) external {
        compoundMarketState.totalSupplied = totalSupplied;
        compoundMarketState.totalRepaid = totalRepaid;
        compoundMarketState.totalBorrowed = totalBorrowed;
    }
}
