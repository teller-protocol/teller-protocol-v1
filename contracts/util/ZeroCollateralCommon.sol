pragma solidity 0.5.17;


library ZeroCollateralCommon {

    enum LoanStatus { NonExistent, TermsSet, Active, Closed }

    // The amount of interest owed to a borrower
    // The interest is just that accrued until `timeLastAccrued`
    struct AccruedInterest {
        uint256 totalAccruedInterest;
        uint256 totalNotWithdrawn;
        uint256 timeLastAccrued;
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

    struct LoanRequest {
        address payable borrower;
        address recipient;
        uint256 amount;
        uint256 duration;
        uint256 requestTime;
    }

    struct LoanResponse {
        uint256 maxAmount;
        uint256 collateralRatio;
        uint256 interestRate;
        uint256 responseTime;
        Signature signature;
    }

    // Data per borrow as struct
    struct Loan {
        uint256 id;
        uint256 collateral;
        uint256 lastCollateralIn;
        uint256 maxLoanAmount;
        uint256 totalOwed;
        uint256 timeStart;
        uint256 timeEnd;
        uint256 interestRate;
        uint256 collateralRatio;
        uint256 termExpiry;
        address payable borrower;
        address recipient;
        LoanStatus status;
        bool liquidated;
    }

    struct Signature {
        uint256 signerNonce;
        uint8 v;
        bytes32 r;
        bytes32 s;
    }
}
