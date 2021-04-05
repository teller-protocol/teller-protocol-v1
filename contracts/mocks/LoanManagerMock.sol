// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../base/loans/LoanManager.sol";

contract LoanManagerMock is LoanManager {
    fallback() external payable {}
}
