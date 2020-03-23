pragma solidity 0.5.17;

library ZeroCollateralCommon {
    
    // Interest accrued from lending account
    struct LendAccount {
        uint256 lastBlockAccrued;
        uint256 totalAccruedInterest;
    }

    // Borrower account details
    struct Borrower {
        uint256 lastBorrowId;
    }

    // Data per borrow as struct
    struct Loan {
        uint256 id;
        address borrower;
        bool active;
        bool liquidated;
        uint256 collateral;
        uint8 interestRate;
        uint8 collateralRatio;
        uint256 maxLoanAmount;
        uint256 totalOwed;
        uint256 blockStart;
        uint256 blockEnd;
    }

    struct Signature {
      uint256 signerNonce;
      uint8 v;
      bytes32 r;
      bytes32 s;
    }
}
