pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Utils
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";

// Interfaces
import "./IMarketRegistry.sol";
import "../providers/compound/CErc20Interface.sol";

// Contracts
import "../base/TToken.sol";

/**
    @notice This interface defines the functions for a lending pool that holds all of the tokens
    that lenders transfer into the protocol.

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
        @param principalAmount amount of tokens towards the principal.
        @param interestAmount amount of tokens towards the interest.
        @param borrower address that is repaying the loan.
     */
    function repay(
        uint256 principalAmount,
        uint256 interestAmount,
        address borrower
    ) external;

    /**
        @notice Once the loan is created, it transfers the amount of tokens to the borrower.
        @param amount of tokens to transfer.
        @param borrower address which will receive the tokens.
        @dev This function only can be invoked by the LoansInterface implementation.
        @dev It throws a require error if current ERC20 balance isn't enough to transfer the tokens.
     */
    function createLoan(uint256 amount, address borrower) external;

    /**
        @notice It gets the lending token address.
        @return the ERC20 lending token address.
    */
    function lendingToken() external view returns (ERC20Detailed);

    /**
        @notice It initializes the contract state variables.
        @param aMarketRegistry the MarketRegistry contract.
        @param aTToken the Teller token to link to the lending pool.
        @param settingsAddress Settings contract address.
        @dev It throws a require error if the contract is already initialized.
     */
    function initialize(
        IMarketRegistry aMarketRegistry,
        TToken aTToken,
        address settingsAddress
    ) external;

    /**
        @notice It gets the cToken address.
        @return the cToken address.
    */
    function cToken() external view returns (CErc20Interface);

    /**
        @notice It gets the tToken address.
        @return the tToken address.
    */
    function tToken() external view returns (TToken);

    /**
        @notice It returns the balance of underlying tokens a lender owns with the amount
        of TTokens owned and the current exchange rate.
        @return a lender's balance of the underlying token in the pool.
     */
    function balanceOfUnderlying(address lender) external returns (uint256);

    /**
        @notice Returns the total amount of interest earned by a lender.
        @dev This value includes already claimed + unclaimed interest earned.
        @return total interest earned by lender.
     */
    function getLenderInterestEarned(address lender) external returns (uint256);

    /**
        @notice Returns the amount of claimable interest a lender has earned.
        @return claimable interest value.
     */
    function getClaimableInterestEarned(address lender)
        external
        returns (uint256);

    /**
        @notice Returns the total amount of interest the pool has earned from repaying loans.
        @return total interest earned from loans.
     */
    function totalInterestEarned() external view returns (uint256);

    /**
        @notice It calculates the market state values across all markets.
        @return values that represent the global state across all markets.
     */
    function getMarketState()
        external
        view
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid,
            uint256 totalOnLoan
        );

    /**
        @notice It gets the debt-to-supply (DtS) ratio for a given market, including a new loan amount.
        @notice The formula to calculate DtS ratio (including a new loan amount) is:

            DtS = (SUM(total borrowed) - SUM(total repaid) + NewLoanAmount) / SUM(total supplied)

        @notice The value has 2 decimal places.
            Example:
                100 => 1%
        @param loanAmount a new loan amount to consider in the ratio.
        @return the debt-to-supply ratio value.
     */
    function getDebtRatioFor(uint256 loanAmount)
        external
        view
        returns (uint256);

    /**
        @notice This event is emitted when an user deposits tokens into the pool.
        @param sender address.
        @param amount of tokens.
     */
    event TokenDeposited(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
        @notice This event is emitted when an user withdraws tokens from the pool.
        @param sender address that withdrew the tokens.
        @param amount of tokens.
     */
    event TokenWithdrawn(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

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
