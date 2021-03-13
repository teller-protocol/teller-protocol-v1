pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../base/Loans.sol";

contract LoansMock is Loans {
    function() external payable {}
}
