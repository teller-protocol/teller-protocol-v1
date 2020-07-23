pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Contracts
import "./LoansBase.sol";

/**
    @notice This contract is used as a basis for the creation of loans (not wei) across the platform
    @notice It implements the LoansBase contract from Teller

    @author develop@teller.finance
 */


contract TokenCollateralLoans is LoansBase {
    /** Constants */

    bool internal constant IS_TRANSFER = true;

    /** Properties */

    /** Modifiers */
    modifier noMsgValue() {
        require(msg.value == 0, "TOKEN_LOANS_VALUE_MUST_BE_ZERO");
        _;
    }

    /** External Functions */

    /**
     * @notice Deposit collateral tokens into a loan.
     * @param borrower The address of the loan borrower.
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount to deposit as collateral.
     */
    function depositCollateral(address borrower, uint256 loanID, uint256 amount)
        external
        payable
        noMsgValue()
        loanActiveOrSet(loanID)
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(lendingPool))
    {
        borrower.requireEqualTo(
            loans[loanID].loanTerms.borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );
        require(amount > 0, "CANNOT_DEPOSIT_ZERO");

        // Update the loan collateral and total. Transfer tokens to this contract.
        _payInCollateral(loanID, amount);

        emit CollateralDeposited(loanID, borrower, amount);
    }

    /**
        @notice Creates a loan with the loan request and terms
        @param request Struct of the protocol loan request
        @param responses List of structs of the protocol loan responses
        @param collateralAmount Amount of collateral required for the loan
     */
    function createLoanWithTerms(
        ZeroCollateralCommon.LoanRequest calldata request,
        ZeroCollateralCommon.LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        noMsgValue()
        isInitialized()
        whenNotPaused()
        isBorrower(request.borrower)
    {
        uint256 loanID = getAndIncrementLoanID();

        (
            uint256 interestRate,
            uint256 collateralRatio,
            uint256 maxLoanAmount
        ) = loanTermsConsensus.processRequest(request, responses);

        loans[loanID] = createLoan(
            loanID,
            request,
            interestRate,
            collateralRatio,
            maxLoanAmount
        );

        if (collateralAmount > 0) {
            // Update collateral, totalCollateral, and lastCollateralIn
            _payInCollateral(loanID, collateralAmount);
        }

        borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            request.borrower,
            request.recipient,
            interestRate,
            collateralRatio,
            maxLoanAmount,
            request.duration,
            loans[loanID].termsExpiry
        );
        if (collateralAmount > 0) {
            emit CollateralDeposited(loanID, request.borrower, collateralAmount);
        }
    }

    /**
        @notice Initializes the current contract instance setting the required parameters, if allowed
        @param priceOracleAddress Contract address of the price oracle
        @param lendingPoolAddress Contract address of the lending pool
        @param loanTermsConsensusAddress Contract adddress for loan term consensus
        @param settingsAddress Contract address for the configuration of the platform
     */
    function initialize(
        address priceOracleAddress,
        address lendingPoolAddress,
        address loanTermsConsensusAddress,
        address settingsAddress,
        address collateralTokenAddress
    ) external isNotInitialized() {
        collateralTokenAddress.requireNotEmpty("PROVIDE_COLL_TOKEN_ADDRESS");

        _initialize(
            priceOracleAddress,
            lendingPoolAddress,
            loanTermsConsensusAddress,
            settingsAddress
        );

        collateralToken = collateralTokenAddress;
    }

    /** Internal Function */
    /**
        @notice Pays out collateral for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payOutCollateral(uint256 loanID, uint256 amount, address payable recipient)
        internal
    {
        totalCollateral = totalCollateral.sub(amount);
        loans[loanID].collateral = loans[loanID].collateral.sub(amount);
        collateralTokenTransfer(recipient, amount);
    }

    /**
        @notice Pays collateral in for the associated loan
        @param loanID The ID of the loan the collateral is for
        @param amount The amount of collateral to be paid
     */
    function _payInCollateral(uint256 loanID, uint256 amount) internal {
        // Update the total collateral and loan collateral
        super._payInCollateral(loanID, amount);
        // Transfer collateral tokens to this contract.
        collateralTokenTransferFrom(msg.sender, amount);
    }

    /**
        @notice Checks to ensure the token balance matches the required balance
        @param initialBalance The inital balance of tokens
        @param expectedAmount The expected balance of tokens
        @param isTransfer If the balance is being checked for a transfer or token allowance
     */
    function _requireExpectedBalance(
        uint256 initialBalance,
        uint256 expectedAmount,
        bool isTransfer
    ) internal view {
        uint256 finalBalance = ERC20Detailed(collateralToken).balanceOf(address(this));
        if (isTransfer) {
            require(
                initialBalance.sub(finalBalance) == expectedAmount,
                "INV_BALANCE_AFTER_TRANSFER"
            );
        } else {
            require(
                finalBalance.sub(initialBalance) == expectedAmount,
                "INV_BALANCE_AFTER_TRANSFER_FROM"
            );
        }
    }

    /** Private Functions */

    /**
        @notice It transfers an amount of collateral tokens to a specific address.
        @param recipient The address which will receive the tokens.
        @param amount The amount of tokens to transfer.
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function collateralTokenTransfer(address recipient, uint256 amount) private {
        uint256 currentBalance = ERC20Detailed(collateralToken).balanceOf(address(this));
        require(currentBalance >= amount, "NOT_ENOUGH_COLL_TOKENS_BALANCE");
        bool transferResult = ERC20Detailed(collateralToken).transfer(recipient, amount);
        require(transferResult, "COLL_TOKENS_TRANSFER_FAILED");
        _requireExpectedBalance(currentBalance, amount, IS_TRANSFER);
    }

    /**
        @notice It transfers an amount of collateral tokens from an address to this contract.
        @param from The address where the tokens will transfer from.
        @param amount The amount to be transferred.
        @dev It throws a require error if the allowance is not enough.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function collateralTokenTransferFrom(address from, uint256 amount) private {
        uint256 currentAllowance = ERC20Detailed(collateralToken).allowance(
            from,
            address(this)
        );
        require(currentAllowance >= amount, "NOT_ENOUGH_COLL_TOKENS_ALLOWANCE");

        uint256 initialBalance = ERC20Detailed(collateralToken).balanceOf(address(this));
        bool transferFromResult = ERC20Detailed(collateralToken).transferFrom(
            from,
            address(this),
            amount
        );
        require(transferFromResult, "COLL_TOKENS_FROM_TRANSFER_FAILED");
        _requireExpectedBalance(initialBalance, amount, !IS_TRANSFER);
    }
}
