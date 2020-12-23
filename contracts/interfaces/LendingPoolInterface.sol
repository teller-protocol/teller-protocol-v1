pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

import "../util/MarketStateLib.sol";

/**
    @notice This interface defines the functions for a lending pool that holds all of the tokens that lenders transfer into the protocol.

    @author develop@teller.finance
 */
interface LendingPoolInterface {
    /**
        @notice It allows users to deposit tokens into the pool.
        @dev the user must call ERC20.approve function previously.
        @param amount of tokens to deposit in the pool.
    */
    function deposit(uint256 amount) external;

    /**
        @notice It allows any tToken holder to burn their tToken tokens and withdraw their tokens.
        @param amount of tokens to withdraw.
        @dev It throws a require error if the contract hasn't enough tokens balance.
        @dev It throws a require error if the holder hasn't enough tToken balance.
     */
    function withdraw(uint256 amount) external;

    /**
        @notice It allows a borrower repaying their loan. 
        @dev This function can be called ONLY by the Loans contract.
        @dev It requires a ERC20.approve call before calling it.
        @dev It throws a require error if borrower called ERC20.approve function before calling it.
        @param amount of tokens.
        @param borrower address that is repaying the loan.
     */
    function repay(uint256 amount, address borrower) external;

    /**
        @notice Once a loan is liquidated, it transfers the amount of tokens to the liquidator address.
        @param amount of tokens to liquidate.
        @param liquidator address to receive the tokens.
        @dev It throws a require error if this contract hasn't enough token balance.
     */
    function liquidationPayment(uint256 amount, address liquidator) external;

    /**
        @notice Once the loan is created, it transfers the amount of tokens to the borrower.
        @param amount of tokens to transfer.
        @param borrower address which will receive the tokens.
        @dev This function only can be invoked by the LoansInterface implementation.
        @dev It throws a require error if current ERC20 balance isn't enough to transfer the tokens.
     */
    function createLoan(uint256 amount, address borrower) external;

    /**
        @notice It allows a lender to withdraw a specific amount of interest.
        @param amount to withdraw.
        @dev It throws a require error if amount exceeds the current accrued interest.
    */
    function withdrawInterest(uint256 amount) external;

    /**
        @notice It gets the lending token address.
        @return the ERC20 lending token address.
    */
    function lendingToken() external view returns (address);

    /**
        @notice It gets the supply-to-debt (StD) ratio for a given market, including a new loan amount.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @param loanAmount a new loan amount to consider in the ratio.
        @return the supply-to-debt ratio value.
     */
    function getSupplyToDebtFor(
        address borrowedAsset,
        address collateralAsset,
        uint256 loanAmount
    ) external view returns (uint256);

    /**
        @notice It gets the current market state.
        @param borrowedAsset borrowed asset address.
        @param collateralAsset collateral asset address.
        @return the current market state.
     */
    function getMarket(address borrowedAsset, address collateralAsset)
        external
        view
        returns (MarketStateLib.MarketState memory);

    /**
        @notice It initializes the contract state variables.
        @param tTokenAddress tToken token address.
        @param lendingTokenAddress ERC20 token address.
        @param lendersAddress Lenders contract address.
        @param loansAddress Loans contract address.
        @param settingsAddress Settings contract address.
        @dev It throws a require error if the contract is already initialized.
     */
    function initialize(
        address tTokenAddress,
        address lendingTokenAddress,
        address lendersAddress,
        address loansAddress,
        address settingsAddress
    ) external;

    /**
        @notice It gets the cToken address.
        @return the cToken address.
    */
    function cToken() external view returns (address);

    /**
        @notice It gets the tToken address.
        @return the tToken address.
    */
    function tToken() external view returns (address);

    /**
        @notice It gets the Lenders contract address.
        @return the Lenders contract address.
    */
    function lenders() external view returns (address);

    /**
        @notice It gets the Loans contract address.
        @return the Loans contract address.
    */
    function loans() external view returns (address);

    /**
        @notice This event is emitted when an user deposits tokens into the pool.
        @param sender address.
        @param amount of tokens.
     */
    event TokenDeposited(address indexed sender, uint256 amount);

    /**
        @notice This event is emitted when an user withdraws tokens from the pool.
        @param sender address that withdrew the tokens.
        @param amount of tokens.
     */
    event TokenWithdrawn(address indexed sender, uint256 amount);

    /**
        @notice This event is emitted when an borrower repaid a loan.
        @param borrower address.
        @param amount of tokens.
     */
    event TokenRepaid(address indexed borrower, uint256 amount);

    /**
        @notice This event is emitted when an lender withdraws interests.
        @param lender address.
        @param amount of tokens.
     */
    event InterestWithdrawn(address indexed lender, uint256 amount);

    /**
        @notice This event is emitted when a liquidator liquidates a loan.
        @param liquidator address.
        @param amount of tokens.
     */
    event PaymentLiquidated(address indexed liquidator, uint256 amount);

    /**
        @notice This event is emitted when the interest validator is updated.
        @param sender account that sends the transaction.
        @param oldInterestValidator the old validator address.
        @param newInterestValidator the new validator address.
     */
    event InterestValidatorUpdated(
        address indexed sender,
        address indexed oldInterestValidator,
        address indexed newInterestValidator
    );
}
