pragma solidity 0.5.17;


library ZeroCollateralCommon {
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

    struct InterestRequest {
        address lender;
        uint256 startTime;
        uint256 endTime;
        uint256 requestTime;
    }

    struct InterestResponse {
        address signer;
        uint256 responseTime;
        uint256 interest;
        Signature signature;
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
