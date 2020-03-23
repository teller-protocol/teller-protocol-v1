pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import '../util/ZeroCollateralCommon.sol';

interface LoansInterface {

    // collateral deposited by borrower
    event CollateralDeposited(uint256 indexed loanID, address indexed borrower, uint256 depositAmount);

    // collateral withdrawn by borrower
    event CollateralWithdrawn(uint256 indexed loanID, address indexed borrower, uint256 depositAmount);

    function borrowerLoans(address borrower) external returns (uint256[] memory);

    function loans(uint256 loanID) external returns (ZeroCollateralCommon.Loan memory);

    function signerNonceTaken(address signer, uint256 nonce) external returns (bool);

    function depositCollateral(address borrower, uint256 loanID) external payable;

    function withdrawCollateral(uint256 amount, uint256 loanID) external;

    function takeOutLoan(
        uint8 interestRate,
        uint8 collateralRatio,
        uint256 maxLoanAmount,
        uint256 numberDays,
        uint256 amountBorrow,
        ZeroCollateralCommon.Signature calldata signature
    ) external payable returns (uint256 loadId);

    // function withdrawDai(uint256 amount, uint256 loanID) external;

    function repayDai(uint256 amount, uint256 loanID) external;

    function liquidateLoan(uint256 loanID) external;

}
