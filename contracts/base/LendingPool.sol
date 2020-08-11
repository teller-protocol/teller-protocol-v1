pragma solidity 0.5.17;

// Libraries

// Commons
import "../util/ZeroCollateralCommon.sol";

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LendersInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../interfaces/ZTokenInterface.sol";
import "../interfaces/InterestValidatorInterface.sol";
import "../providers/compound/CErc20Interface.sol";

// Contracts
import "./Base.sol";


/**
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol. It is the contract that lenders interact with to deposit and withdraw their tokens including interest. The LendingPool interacts with the Lenders contract to ensure token balances and interest owed is kept up to date.

    @author develop@teller.finance
 */
contract LendingPool is Base, LendingPoolInterface {
    /* State Variables */

    IERC20 public lendingToken;

    address public cToken;

    ZTokenInterface public zToken;

    LendersInterface public lenders;

    InterestValidatorInterface public interestValidator;

    address public loans;

    /** Modifiers */

    /**
        @notice It checks the address is the Loans contract address.
        @dev It throws a require error if parameter is not equal to loans contract address.
     */
    modifier isLoan() {
        loans.requireEqualTo(msg.sender, "ADDRESS_ISNT_LOANS_CONTRACT");
        _;
    }

    /* Constructor */

    /** External Functions */

    /**
        @notice It allows users to deposit tokens into the pool.
        @dev the user must call ERC20.approve function previously.
        @dev If the cToken is available (not 0x0), it deposits the lending token amount into Compound directly.
        @param amount of tokens to deposit in the pool.
    */
    function deposit(uint256 amount)
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
    {
        // Transfering tokens to the LendingPool
        tokenTransferFrom(msg.sender, amount);

        // deposit them straight into compound
        _depositToCompoundIfSupported(amount);

        // Mint zToken tokens
        zTokenMint(msg.sender, amount);

        markets.increaseSupply(
            address(lendingToken),
            LoansInterface(loans).collateralToken(),
            amount
        );

        // Emit event
        emit TokenDeposited(msg.sender, amount);
    }

    /**
        @notice It allows any zToken holder to burn their zToken tokens and withdraw their tokens.
        @dev If the cToken is available (not 0x0), it withdraws the lending tokens from Compound before transferring the tokens to the holder.
        @param amount of tokens to withdraw.
     */
    function withdraw(uint256 amount)
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
        nonReentrant()
    {
        // Burn zToken tokens.
        zToken.burn(msg.sender, amount);

        // Withdraw the tokens from compound
        _withdrawFromCompoundIfSupported(amount);

        // Transfers tokens
        tokenTransfer(msg.sender, amount);

        markets.decreaseSupply(
            address(lendingToken),
            LoansInterface(loans).collateralToken(),
            amount
        );

        // Emit event.
        emit TokenWithdrawn(msg.sender, amount);
    }

    /**
        @notice It allows a borrower repaying their loan.
        @dev This function can be called ONLY by the Loans contract.
        @dev It requires a ERC20.approve call before calling it.
        @dev It throws a require error if borrower called ERC20.approve function before calling it.
        @param amount of tokens.
        @param borrower address that is repaying the loan.
     */
    function repay(uint256 amount, address borrower)
        external
        isInitialized()
        isLoan()
        whenLendingPoolNotPaused(address(this))
    {
        // Transfers tokens to LendingPool.
        tokenTransferFrom(borrower, amount);

        // deposit them straight into compound
        _depositToCompoundIfSupported(amount);

        // Emits event.
        emit TokenRepaid(borrower, amount);
    }

    /**
        @notice Once a loan is liquidated, it transfers tokens from the liquidator to the lending pool.
        @param amount of tokens to liquidate.
        @param liquidator address used to liquidate the loan.
     */
    function liquidationPayment(uint256 amount, address liquidator)
        external
        isInitialized()
        isLoan()
        whenLendingPoolNotPaused(address(this))
    {
        // Transfers tokens from liquidator to lending pool
        tokenTransferFrom(liquidator, amount);

        // deposit them straight into compound
        _depositToCompoundIfSupported(amount);

        // Emits event
        emit PaymentLiquidated(liquidator, amount);
    }

    /**
        @notice Once the loan is created, it transfers the amount of tokens to the borrower.

        @param amount of tokens to transfer.
        @param borrower address which will receive the tokens.
        @dev This function only can be invoked by the LoansInterface implementation.
        @dev It withdraws the lending tokens from Compound before transferring tokens to the borrower.
     */
    function createLoan(uint256 amount, address borrower)
        external
        isInitialized()
        isLoan()
        whenLendingPoolNotPaused(address(this))
    {
        // Withdraw the tokens from compound if it is supported
        _withdrawFromCompoundIfSupported(amount);

        // Transfer tokens to the borrower.
        tokenTransfer(borrower, amount);
    }

    /**
        @notice It allows the lenders to withdraw interest.
        @param amount interest amount to withdraw.
        @dev It withdraws lending tokens from Compound before transferring the tokens to the lender.
     */
    function withdrawInterest(uint256 amount)
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
    {
        address lender = msg.sender;
        require(
            address(interestValidator) == address(0x0) ||
                interestValidator.isInterestValid(
                    address(lendingToken),
                    LoansInterface(loans).collateralToken(),
                    lender,
                    amount
                ),
            "INTEREST_TO_WITHDRAW_IS_INVALID"
        );

        // update the lenders record, returning the actual amount to withdraw
        uint256 amountToWithdraw = lenders.withdrawInterest(lender, amount);

        // Withdraw the tokens from compound
        _withdrawFromCompoundIfSupported(amountToWithdraw);

        // Transfer tokens to the lender.
        tokenTransfer(lender, amountToWithdraw);

        emit InterestWithdrawn(lender, amountToWithdraw);
    }

    /**
        @notice Update the current interest validator address.
        @param newInterestValidator the new interest validator address.
     */
    function setInterestValidator(address newInterestValidator)
        external
        whenAllowed(msg.sender)
    {
        require(newInterestValidator.isContract(), "VALIDATOR_MUST_CONTRACT_NT_EMPTY");
        address oldInterestValidator = address(interestValidator);
        oldInterestValidator.requireNotEqualTo(
            newInterestValidator,
            "NEW_VALIDATOR_MUST_BE_PROVIDED"
        );

        interestValidator = InterestValidatorInterface(newInterestValidator);

        emit InterestValidatorUpdated(
            msg.sender,
            oldInterestValidator,
            newInterestValidator
        );
    }

    /**
        @notice It initializes the contract state variables.
        @param zTokenAddress zToken token address.
        @param lendingTokenAddress ERC20 token address.
        @param lendersAddress Lenders contract address.
        @param loansAddress Loans contract address.
        @param settingsAddress Settings contract address.
        @param marketsAddress Markets state conntract address.
        @param interestValidatorAddress Interest validator address. It can be 0x0.
        @dev It throws a require error if the contract is already initialized.
     */
    function initialize(
        address zTokenAddress,
        address lendingTokenAddress,
        address lendersAddress,
        address loansAddress,
        address cTokenAddress,
        address settingsAddress,
        address marketsAddress,
        address interestValidatorAddress
    ) external isNotInitialized() {
        zTokenAddress.requireNotEmpty("ZTOKEN_ADDRESS_IS_REQUIRED");
        lendingTokenAddress.requireNotEmpty("TOKEN_ADDRESS_IS_REQUIRED");
        lendersAddress.requireNotEmpty("LENDERS_ADDRESS_IS_REQUIRED");
        loansAddress.requireNotEmpty("LOANS_ADDRESS_IS_REQUIRED");
        require(
            interestValidatorAddress.isEmpty() || interestValidatorAddress.isContract(),
            "VAL_MUST_BE_EMPTY_OR_CONTRACT"
        );

        _initialize(settingsAddress, marketsAddress);

        zToken = ZTokenInterface(zTokenAddress);
        lendingToken = IERC20(lendingTokenAddress);
        lenders = LendersInterface(lendersAddress);
        loans = loansAddress;
        cToken = cTokenAddress;
        interestValidator = InterestValidatorInterface(interestValidatorAddress);
    }

    /** Internal functions */

    /**
        @notice It deposits a given amount of tokens to Compound only if the cToken is not empty.
        @param amount amount to deposit.
     */
    function _depositToCompoundIfSupported(uint256 amount) internal {
        if (_isCTokenNotSupported()) {
            return;
        }
        // approve the cToken contract to take lending tokens
        lendingToken.approve(address(cToken), amount);

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = CErc20Interface(cToken).mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");
    }

    /**
        @notice It withdraws a given amount of tokens if the cToken is defined (not 0x0).
        @param amount amount of tokens to withdraw.
     */
    function _withdrawFromCompoundIfSupported(uint256 amount) internal {
        if (_isCTokenNotSupported()) {
            return;
        }
        // this function withdraws 'amount' lending tokens from compound
        // another function exists to withdraw 'amount' cTokens of lending tokens
        uint256 redeemResult = CErc20Interface(cToken).redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_WITHDRAWAL_ERROR");
    }

    /**
        @notice It tests whether cToken address is defined (not 0x0) or not.
        @return true if the cToken address is not 0x0. Otherwise it returns false.
     */
    function _isCTokenNotSupported() internal view returns (bool) {
        return address(cToken) == address(0x0);
    }

    /** Private functions */

    /**
        @notice It transfers an amount of tokens to a specific address.
        @param recipient address which will receive the tokens.
        @param amount of tokens to transfer.
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function tokenTransfer(address recipient, uint256 amount) private {
        uint256 currentBalance = lendingToken.balanceOf(address(this));
        require(currentBalance >= amount, "LENDING_TOKEN_NOT_ENOUGH_BALANCE");
        bool transferResult = lendingToken.transfer(recipient, amount);
        require(transferResult, "LENDING_TRANSFER_FAILED");
    }

    /**
        @notice It transfers an amount of tokens from an address to this contract.
        @param from address where the tokens will transfer from.
        @param amount to be transferred.
        @dev It throws a require error if 'transferFrom' invocation fails.
     */
    function tokenTransferFrom(address from, uint256 amount) private {
        uint256 allowance = lendingToken.allowance(from, address(this));
        require(allowance >= amount, "LEND_TOKEN_NOT_ENOUGH_ALLOWANCE");
        bool transferFromResult = lendingToken.transferFrom(from, address(this), amount);
        require(transferFromResult, "LENDING_TRANSFER_FROM_FAILED");
    }

    /**
        @notice It mints zToken tokens, and send them to a specific address.
        @param to address which will receive the minted tokens.
        @param amount to be minted.
        @dev This contract must has a Minter Role in zToken (mintable) token.
        @dev It throws a require error if mint invocation fails.
     */
    function zTokenMint(address to, uint256 amount) private {
        bool mintResult = zToken.mint(to, amount);
        require(mintResult, "ZTOKEN_MINT_FAILED");
    }
}
