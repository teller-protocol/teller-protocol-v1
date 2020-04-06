pragma solidity 0.5.17;

/**
    @notice This interface defines the functions for a DAI pool that holds all of the DAI that lenders transfer into the protocol.
 */
interface DAIPoolInterface {

    /**
        @notice It allows users to deposit DAIs into the pool.
        @dev the user must call DAI.approve function previously.
        @param amount of DAIs to deposit in the pool.
    */
    function depositDai(uint256 amount) external;

    /**
        @notice It allows any zDAI holder to burn their zDAI tokens and withdraw their DAIs.
        @param amount of DAI tokens to withdraw.
        @dev It throws a require error if the contract hasn't enough DAI balance.
        @dev It throws a require error if the holder hasn't enough zDAI balance.
     */
    function withdrawDai(uint256 amount) external;

    /**
        @notice It allows a borrower repaying their loan. 
        @dev This function can be called ONLY by the Loans contract.
        @dev It requires a DAI.approve call before calling it.
        @dev It throws a require error if borrower called DAI.approve function before calling it.
        @param amount in DAI tokens.
        @param borrower address that is repaying the loan.
     */
    function repayDai(uint256 amount, address borrower) external;

    /**
        @notice Once a loan is liquidated, it transfers the amount in DAI tokens to the liquidator address.
        @param amount in DAI tokens to liquidate.
        @param liquidator address to receive the tokens.
        @dev It throws a require error if this contract hasn't enough DAI balance.
     */
    function liquidationPayment(uint256 amount, address liquidator) external;

    /**
        @notice Ønce the loan is created, it transfers the amount of DAIs to the borrower.
        @param amount of DAI tokens to transfer.
        @param borrower address which will receive the DAI tokens.
        @dev This function only can be invoked by the LoansInterface implementation.
        @dev It throws a require error if current DAI balance isn't enough to transfer the DAIs.
     */
    function createLoan(uint256 amount, address borrower) external;

    function withdrawInterest(uint256 amount) external;

    /**
        @notice This event is emitted when an user deposits DAI tokens into the pool.
        @param sender address.
        @param amount of DAI tokens.
     */
    event DaiDeposited(address sender, uint256 amount);

    /**
        @notice This event is emitted when an user withdraws DAI tokens from the pool.
        @param sender address that withdrew the DAIs tokens.
        @param amount of DAI tokens.
     */
    event DaiWithdrew(address sender, uint256 amount);

    /**
        @notice This event is emitted when an borrower repaid a loan.
        @param borrower address.
        @param amount in DAIs.
     */
    event DaiRepaid(address borrower, uint256 amount);

    /**
        @notice This event is emitted when a liquidator liquidates a loan.
        @param liquidator address.
        @param amount of DAI tokens.
     */
    event PaymentLiquidated(address liquidator, uint256 amount);


}
