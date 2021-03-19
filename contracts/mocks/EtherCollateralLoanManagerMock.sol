pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../base/loans/EtherCollateralLoans.sol";
import "./LoansMock.sol";

contract EtherCollateralLoanManagerMock is
    EtherCollateralLoans,
    LoanManagerMock
{}
