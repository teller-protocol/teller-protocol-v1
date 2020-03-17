pragma solidity 0.5.17;

contract ZeroCollateralCommon {
    
    // Interest accrued from lending account
    struct LendAccount {
        uint256 lastBlockAccrued;
        uint256 totalAccruedInterest;
    }

    // Borrower account details
    struct BorrowAccount {
        uint256 lastBorrowId;
        uint256 collateral;
        uint256 maxLoan;
        uint8 interestRate;
        uint8 collateralNeeded;
    }

    // Data per borrow as struct
    struct Borrow {
        uint256 amountBorrow;
        uint256 amountOwed;
        uint256 amountOwedInitial;
        uint256 blockStart;
        uint256 blockEnd;
        address account;
        uint256 id;
        bool active;
        bool liquidated;
    }
}
