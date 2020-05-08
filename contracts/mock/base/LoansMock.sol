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

import "../../base/Loans.sol";

contract LoansMock is Loans {

    constructor(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        uint256 safetyInterval
    ) public Loans(
        priceOracleAddress,
        lendingPoolAddress,
        loanTermsConsensusAddress,
        safetyInterval
    ) { }

    function setLoanIDCounter(uint256 newLoanIdCounter)
        external
    {
        loanIDCounter = newLoanIdCounter;
    }

    function setBorrowerLoans(address borrower, uint256[] calldata loanIDs) external {
        borrowerLoans[borrower] = loanIDs;
    }

    function setTotalCollateral(uint256 amount) external {
        totalCollateral = amount;
    }

    function externalPayLoan(uint256 loanID, uint256 toPay) external {
        _payLoan(loanID, toPay);
    }

    function externalConvertWeiToToken(uint256 weiAmount) external returns (uint256) {
        return _convertWeiToToken(weiAmount);
    }

    function externalConvertTokenToWei(uint256 tokenAmount) external returns (uint256) {
        return _convertTokenToWei(tokenAmount);
    }

    function setLoan(
        uint256 id,
        ZeroCollateralCommon.LoanTerms calldata loanTerms,
        uint256 termsExpiry,
        uint256 loanStartTime,
        uint256 collateral,
        uint256 lastCollateralIn,
        uint256 principalOwed,
        uint256 interestOwed,
        ZeroCollateralCommon.LoanStatus status,
        bool liquidated
    ) external {
        loans[id] = ZeroCollateralCommon.Loan({
            id: id,
            loanTerms: loanTerms,
            termsExpiry: termsExpiry,
            loanStartTime: loanStartTime,
            collateral: collateral,
            lastCollateralIn: lastCollateralIn,
            principalOwed: principalOwed,
            interestOwed: interestOwed,
            status: status,
            liquidated: liquidated
        });
    }

    function() external payable {}

}