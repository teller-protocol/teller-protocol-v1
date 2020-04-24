/*
    Copyright 2020 Fabrx Labs Inc.

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";


interface LoansInterface {
    // collateral deposited by borrower
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    // collateral withdrawn by borrower
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    event LoanRequested(
        uint256 indexed requestedLoanId,
        address indexed borrower,
        uint256 amount,
        uint32 numberOfDays
    );

    event LoanTermsUpdated(
        uint256 indexed requestedLoanId,
        address indexed borrower,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    );

    // new loan created
    event LoanCreated(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount,
        uint256 numberDays
    );

    function getBorrowerLoans(address borrower) external view returns (uint256[] memory);

    function requestedLoans(uint256 loanID)
        external
        returns (ZeroCollateralCommon.RequestedLoan memory);

    function loans(uint256 loanID) external returns (ZeroCollateralCommon.Loan memory);

    function depositCollateral(address borrower, uint256 loanID) external payable;

    function withdrawCollateral(uint256 amount, uint256 loanID) external;

    function requestLoan(uint256 amount, uint16 numberOfDays) external;

    function takeOutLoan() external payable returns (uint256);

    function repay(uint256 amount, uint256 loanID) external;

    function liquidateLoan(uint256 loanID) external;

    function setLoanTerms(
        address borrower,
        uint256 requestedLoanId,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) external;
}
