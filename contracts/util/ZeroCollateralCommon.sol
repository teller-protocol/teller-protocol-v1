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
        uint256 collateral;
        uint256 maxLoanAmount;
        uint256 totalOwed;
        uint256 timeStart;
        uint256 timeEnd;
        address payable borrower;
        bool active;
        bool liquidated;
        uint8 interestRate;
        uint8 collateralRatio;
    }

    struct Signature {
      uint256 signerNonce;
      uint8 v;
      bytes32 r;
      bytes32 s;
    }
}
