pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/ZeroCollateralCommon.sol";

/**
    @notice This interface defines the functions to work with the Teller loans protocol

    @author develop@teller.finance
 */

interface LoansInterface {
    /**
        @notice This event is emitted when collateral has been deposited for the loan
        @param loanId uint256 ID of the loan for which collateral was deposited
        @param borrower address Account address of the borrower
        @param depositAmount uint256 Amount of collateral deposited
     */
    event CollateralDeposited(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 depositAmount
    );

    /**
        @notice This event is emitted when collateral has been withdrawn
        @param loanID uint256 ID of loan from which collateral was withdrawn
        @param borrower address Account address of the borrower
     */
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 withdrawalAmount
    );

    /**
        @notice This event is emitted when loan terms have been successsfully set
        @param loanID uint256 ID of loan from which collateral was withdrawn
        @param borrower address Account address of the borrower
        @param recipient address Account address of the recipient
        @param interestRate uint256 Interest rate set in the loan terms
        @param collateralRatio uint256 Collateral ratio set in the loan terms
        @param maxLoanAmount uint256 Maximum loan amount that can be taken out, set in the loan terms
     */
    event LoanTermsSet(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount,
        uint256 duration,
        uint256 termsExpiry
    );

    /**
        @notice This event is emitted when a loan has been successfully taken out
        @param loanID uint256 ID of loan from which collateral was withdrawn
        @param borrower address Account address of the borrower
        @param amountBorrowed uint256 Total amount taken out in the loan
     */
    event LoanTakenOut(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountBorrowed
    );

    /**
        @notice This event is emitted when a loan has been successfully repaid
        @param loanID uint256 ID of loan from which collateral was withdrawn
        @param borrower address Account address of the borrower
        @param amountPaid uint256 Amount of the loan paid back
        @param payer address Account address of the payer
        @param totalOwed uint256 Total amount of the loan to be repaid
     */
    event LoanRepaid(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountPaid,
        address payer,
        uint256 totalOwed
    );

    /**
        @notice This event is emitted when a loan has been successfully liquidated
        @param loanID uint256 ID of loan from which collateral was withdrawn
        @param borrower address Account address of the borrower
        @param liquidator address Account address of the liquidator
        @param collateralOut uint256 Collateral that is sent to the liquidator
        @param tokensIn uint256 Percentage of the collateral price paid by the liquidator to the lending pool
     */
    event LoanLiquidated(
        uint256 indexed loanID,
        address indexed borrower,
        address liquidator,
        uint256 collateralOut,
        uint256 tokensIn
    );

    /**
        @notice Returns a list of all loans for a borrower
        @param borrower address Account address of the borrower
     */
    function getBorrowerLoans(address borrower) external view returns (uint256[] memory);

    /**
        @notice Returns the struct of a loan
        @param loanID uint256 ID of loan from which collateral was withdrawn
     */
    function loans(uint256 loanID)
        external
        view
        returns (ZeroCollateralCommon.Loan memory);

    /**
        @param Deposit collateral for a loan, unless it isn't allowed
        @param borrower address Account address of the borrower
        @param loanID uint256 ID of loan from which collateral was withdrawn
        @param amount uint256 Amount to be deposited as collateral
     */
    function depositCollateral(address borrower, uint256 loanID, uint256 amount)
        external
        payable;

    /**
        @notice Withdraw collateral from a loan, unless this isn't allowed
        @param amount uint256 The amount of collateral token or ether the caller is hoping to withdraw
        @param loanID uint256 The ID of the loan the collateral is for
     */
    function withdrawCollateral(uint256 amount, uint256 loanID) external;

    /**
        @notice Create a loan with specified terms, if allowed
        @param ZeroCollateralCommon.LoanRequest request Struct of the protocol loan request
        @param ZeroCollateralCommon.LoanResponses request List of structs of the protocol loan responses
        @param collateralAmount uint256 Amount of collateral for the loan
     */
    function createLoanWithTerms(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    ) external payable;

    /**
        @notice Take out a loan, if allowed
        @param loanID uint256 The ID of the loan to be taken out
        @param amountBorrow uint256 Amount of tokens to be taken out in the loan
     */
    function takeOutLoan(uint256 loanID, uint256 amountBorrow) external;

    /**
        @notice Make a payment to a specified loan
        @param amount uint256 The amount of tokens to pay back to the loan
        @param loanID uint256 The ID of the loan the payment is for
     */
    function repay(uint256 amount, uint256 loanID) external;

    /**
        @notice Liquidate a loan if has is expired or undercollateralised
        @param loanID uint256 The ID of the loan to be liquidated
     */
    function liquidateLoan(uint256 loanID) external;

    /**
        @notice Get the current price oracle
        @return address Contract adddress of the price oracle
     */
    function priceOracle() external view returns (address);

    /**
        @notice Returns the lending token in the lending pool
        @return address Contract adddress of the lending pool
     */
    function lendingPool() external view returns (address);

    /**
        @notice Returns the lending token in the lending pool
        @return address Contract address of the lending token
     */
    function lendingToken() external view returns (address);

    /**
        @notice Returns the total amount of collateral
        @return uint256 The total amount of collateral held by the contract instance
     */
    function totalCollateral() external view returns (uint256);

    /**
        @notice Returns the ID of loans taken out
        @param uint256 The next available loan ID
     */
    function loanIDCounter() external view returns (uint256);

    /**
        @notice Returns the collateral token
        @return address Contract address of the token
     */
    function collateralToken() external view returns (address);

    /**
        @notice Get collateral infomation of a specific loan
        @param Loan ID of the loan to get info for
        @return uint256 Collateral needed
        @return uint256 Collaternal needed in Lending tokens
        @return uint256 Collateral needed in Collateral tokens
        @return bool If more collateral is needed or not
     */
    function getCollateralInfo(uint256 loanID)
        external
        view
        returns (
            uint256 collateral,
            uint256 collateralNeededLendingTokens,
            uint256 collateralNeededCollateralTokens,
            bool requireCollateral
        );
}
