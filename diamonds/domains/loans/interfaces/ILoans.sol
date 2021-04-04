// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ILoanManager.sol";
import "./ILoanData.sol";
import "./ILoanStorage.sol";
import "./ILoanTermsConsensus.sol";

abstract contract ILoans is
    ILoanManager,
    ILoanData,
    ILoanTermsConsensus,
    ILoanStorage,
    ALoanStorage
{}
