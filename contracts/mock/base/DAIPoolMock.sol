// This is just to be used as a DAIPool template for the gnosis Mock Contracts, until the DAIPool contract
// is completed. At that point we can use that as the template
pragma solidity 0.5.17;

import "../../interfaces/DAIPoolInterface.sol";

contract DAIPoolMock is DAIPoolInterface {

    function depositDai(uint256) external {}

    function withdrawDai(uint256 amount) external {}

    function repayDai(uint256, address) external {}

    function liquidationPayment(uint256, address) external {}

    function createLoan(uint256, address) external {}

    function withdrawInterest(uint256 amount) external {}
}