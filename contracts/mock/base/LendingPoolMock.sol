// This is just to be used as a LendingPool template for the gnosis Mock Contracts, until the LendingPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;

import "../../interfaces/LendingPoolInterface.sol";


contract LendingPoolMock is LendingPoolInterface {
    function deposit(uint256) external {}

    function withdraw(uint256 amount) external {}

    function repay(uint256, address) external {}

    function liquidationPayment(uint256, address) external {}

    function createLoan(uint256, address) external {}

    function withdrawInterest(uint256 amount) external {}

    function lendingToken() external view returns (address) {
        return address(0x0);
    }
}
