pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../base/loans/LoanManager.sol";

contract LoanManagerMock is LoanManager {
    function() external payable {}
}
