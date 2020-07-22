pragma solidity 0.5.17;

import "./NumbersList.sol";

/**
 * @dev Library of structs common across the Teller protocol
 *
 * @author develop@teller.finance
 */
library ZeroCollateralCommon {
    enum LoanStatus {NonExistent, TermsSet, Active, Closed}

    // The amount of interest owed to a borrower
    // The interest is just that accrued until `timeLastAccrued`
    struct AccruedInterest {
        uint256 totalAccruedInterest;
        uint256 totalNotWithdrawn;
        uint256 timeLastAccrued;
    }

    // Represents a user signature
    struct Signature {
        uint256 signerNonce;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }

    // Consensus request object for accruing interest
    struct InterestRequest {
        address lender;
        address consensusAddress;
        uint256 startTime;
        uint256 endTime;
        uint256 requestTime;
    }

    // Consensus response object for accruing interest
    struct InterestResponse {
        address signer;
        address consensusAddress;
        uint256 responseTime;
        uint256 interest;
        Signature signature;
    }

    // Borrower request object to take out a loan
    struct LoanRequest {
        address payable borrower;
        address recipient;
        address consensusAddress;
        uint256 requestNonce;
        uint256 amount;
        uint256 duration;
        uint256 requestTime;
    }

    // Borrower response object to take out a loan
    struct LoanResponse {
        address signer;
        address consensusAddress;
        uint256 responseTime;
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 maxLoanAmount;
        Signature signature;
    }

    // Represents loan terms based on consensus values
    struct AccruedLoanTerms {
        NumbersList.Values interestRate;
        NumbersList.Values collateralRatio;
        NumbersList.Values maxLoanAmount;
    }

    // Represents the terms of a loan based on the consensus of a LoanRequest
    struct LoanTerms {
        address payable borrower;
        address recipient;
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 maxLoanAmount;
        uint256 duration;
    }

    // Data per borrow as struct
    struct Loan {
        uint256 id;
        LoanTerms loanTerms;
        uint256 termsExpiry;
        uint256 loanStartTime;
        uint256 collateral;
        uint256 lastCollateralIn;
        uint256 principalOwed;
        uint256 interestOwed;
        uint256 borrowedAmount;
        LoanStatus status;
        bool liquidated;
    }
}
