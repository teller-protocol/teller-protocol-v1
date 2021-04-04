// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "../../../../contracts/providers/openzeppelin/Roles.sol";
import "./loans-consts.sol";
import "../storage/loans.sol";
import "../../protocol/interfaces/ISettings.sol";

abstract contract int_Loans_v1 is
    Roles,
    LoansConsts,
    sto_Loans_v1,
    ext_PlatformSettings_v1
{
    function s() internal pure returns (sto_Loans_v1.LoansLayout storage l_) {
        l_ = sto_Loans_v1.getLoansStorage();
    }

    function _createNewLoan(
        TellerCommon.LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal returns (uint256) {
        // Get and increment new loan ID
        uint256 loanID = loanIDCounter;
        loanIDCounter = loanIDCounter.add(1);

        require(
            loans[loanID].status == TellerCommon.LoanStatus.NonExistent,
            "LOAN_ALREADY_EXISTS"
        );
        require(request.borrower != address(0), "BORROWER_EMPTY");

        s().loans[loanID].id = loanID;
        s().loans[loanID].status = TellerCommon.LoanStatus.TermsSet;
        s().loans[loanID].loanTerms = TellerCommon.LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        uint256 termsExpiryTime = settings.getTermsExpiryTimeValue();
        s().loans[loanID].termsExpiry = block.timestamp.add(termsExpiryTime);

        return loanID;
    }

    function _createEscrow(uint256 loanID) internal returns (address escrow) {
        require(
            s().loans[loanID].escrow == address(0x0),
            "LOAN_ESCROW_ALREADY_EXISTS"
        );

        escrow = _clone(initDynamicProxyLogic);
        IInitializeableDynamicProxy(escrow).initialize(
            address(logicRegistry),
            keccak256("Escrow"),
            true
        );
        ext_PlatformSettings_v1.addEscrowAuthorized(escrow);
    }
}

abstract contract int_Loans is int_Loans_v1 {}
