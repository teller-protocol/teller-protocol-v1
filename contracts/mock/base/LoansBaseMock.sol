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

import "../../base/LoansBase.sol";

contract LoansBaseMock is LoansBase {

    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal {}

    function _emitCollateralWithdrawnEvent(
        uint256 loanID,
        address payable recipient,
        uint256 amount
    ) internal {}

    function _emitLoanTakenOutEvent(uint256 loanID, uint256 amountBorrow) internal {}

    function _emitLoanRepaidEvent(
        uint256 loanID,
        uint256 amountPaid,
        address payer,
        uint256 totalOwed
    ) internal {}

    function _emitLoanLiquidatedEvent(
        uint256 loanID,
        address liquidator,
        uint256 collateralOut,
        uint256 tokensIn
    ) internal {}

    function externalPayLoan(uint256 loanID, uint256 toPay) external {
        _payLoan(loanID, toPay);
    }

    function externalConvertWeiToToken(uint256 weiAmount) external view returns (uint256) {
        return _convertWeiToToken(weiAmount);
    }

    function externalConvertTokenToWei(uint256 tokenAmount) external view returns (uint256) {
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
        uint256 borrowedAmount,
        ZeroCollateralCommon.LoanStatus status,
        bool liquidated
    ) external {
        require(loanTerms.maxLoanAmount >= borrowedAmount, "BORROWED_AMOUNT_EXCEEDS_MAX");
        loans[id] = ZeroCollateralCommon.Loan({
            id: id,
            loanTerms: loanTerms,
            termsExpiry: termsExpiry,
            loanStartTime: loanStartTime,
            collateral: collateral,
            lastCollateralIn: lastCollateralIn,
            principalOwed: principalOwed,
            interestOwed: interestOwed,
            borrowedAmount: borrowedAmount,
            status: status,
            liquidated: liquidated
        });
    }

    function initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress
    ) external isNotInitialized() {
        _initialize(
            priceOracleAddress,
            lendingPoolAddress,
            loanTermsConsensusAddress,
            settingsAddress
        );
    }
}