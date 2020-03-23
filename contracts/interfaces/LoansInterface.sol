pragma solidity 0.5.17;

interface LoansInterface {

    // collateral deposited by borrower
    event CollateralDeposited(uint256 indexed loanID, address indexed borrower, uint256 depositAmount);

    // collateral withdrawn by borrower
    event ColalteralWithdrawn(uint256 indexed loanID, address indexed borrower, uint256 depositAmount);

    function depositCollateral(uint256 loanId) external returns (uint256);

    function withdrawCollateral(uint256 amount, uint256 loanId) external;

    function takeOutLoan(uint256 amountBorrow, uint256 numberDays) external returns (uint256 loadId);

    // function withdrawDai(uint256 amount, uint256 loanId) external;

    function repayDai(uint256 amount, uint256 loanId) external;

    function liquidateLoan(uint256 loanId) external;

}
