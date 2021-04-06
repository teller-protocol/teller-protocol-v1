// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./ILoanManager.sol";
import "./ILendingPool.sol";

interface IMarket is ILoanManager, ILendingPool {}
