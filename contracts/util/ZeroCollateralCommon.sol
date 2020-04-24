pragma solidity 0.5.17;

import "./NumbersList.sol";


library ZeroCollateralCommon {
    enum RequestedLoanStatus {NonExistent, Processing, Processed, TakenOut}

    // Borrower account details
    struct Borrower {
        uint256 lastBorrowId;
    }

    // The amount of interest owed to a borrower
    // The interest is just that accrued until `blockLastAccrued`
    struct AccruedInterest {
        uint256 totalAccruedInterest;
        uint256 totalNotWithdrawn;
        uint256 blockLastAccrued;
    }

    struct AggregatedInterest {
        uint256 totalSubmissions;
        uint256 maxValue;
        uint256 minValue;
        uint256 sumOfValues;
        bool finalized;
    }

    struct AggregatedLoanTerms {
        NumbersList.Values interestRates;
        NumbersList.Values collateralRatios;
        NumbersList.Values maxLoanAmounts;
    }

    struct RequestedLoan {
        // Requested Loan Data
        address payable borrower;
        uint256 id;
        uint256 amount;
        uint256 numberOfDays;
        // Loan Terms
        uint256 maxLoanAmount;
        uint256 interestRate;
        uint256 collateralRatio;
        // Requested Loan Status
        uint256 processedAt;
        RequestedLoanStatus status;
    }

    // Data per borrow as struct
    struct Loan {
        uint256 id;
        uint256 collateral;
        uint256 maxLoanAmount;
        uint256 totalOwed;
        uint256 timeStart;
        uint256 timeEnd;
        uint256 interestRate;
        uint256 collateralRatio;
        address payable borrower;
        bool active;
        bool liquidated;
    }

    struct Signature {
        uint256 signerNonce;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
}
