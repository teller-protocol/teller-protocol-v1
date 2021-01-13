pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../util/CompoundRatesLib.sol";

// Commons

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../interfaces/IERC20Detailed.sol";
import "../interfaces/TTokenInterface.sol";
import "../providers/compound/CErc20Interface.sol";

// Contracts
import "./Base.sol";

/*****************************************************************************************************/
/**                                             WARNING                                             **/
/**                                  THIS CONTRACT IS UPGRADEABLE!                                  **/
/**  ---------------------------------------------------------------------------------------------  **/
/**  Do NOT change the order of or PREPEND any storage variables to this or new versions of this    **/
/**  contract as this will cause the the storage slots to be overwritten on the proxy contract!!    **/
/**                                                                                                 **/
/**  Visit https://docs.openzeppelin.com/upgrades/2.6/proxies#upgrading-via-the-proxy-pattern for   **/
/**  more information.                                                                              **/
/*****************************************************************************************************/
/**
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol. It is the contract that lenders interact with to deposit and withdraw their tokens including interest.

    @author develop@teller.finance
 */
contract LendingPool is Base, LendingPoolInterface {
    using SafeMath for uint256;
    using SafeERC20 for IERC20Detailed;
    using MarketStateLib for MarketStateLib.MarketState;
    using CompoundRatesLib for CErc20Interface;

    /* State Variables */

    IERC20Detailed public lendingToken;

    TTokenInterface public tToken;

    address public loans;

    uint256 public constant EXCHANGE_RATE_SCALE = 10**18;

    MarketStateLib.MarketState internal marketState;

    MarketStateLib.MarketState internal compoundMarketState;

    /** Modifiers */

    /**
        @notice It checks the address is the Loans contract address.
        @dev It throws a require error if parameter is not equal to loans contract address.
     */
    modifier isLoan() {
        _requireIsLoan();
        _;
    }

    /* Constructor */

    /** External Functions */

    /**
        @notice It allows users to deposit tokens into the pool.
        @dev the user must call ERC20.approve function previously.
        @dev If the cToken is available (not 0x0), it deposits the lending token amount into Compound directly.
        @param lendingTokenAmount of tokens to deposit in the pool.
    */
    function deposit(uint256 lendingTokenAmount)
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
    {
        uint256 tTokenAmount = lendingTokenAmount.mul(EXCHANGE_RATE_SCALE).div(
            _exchangeRate()
        );

        // Transfering tokens to the LendingPool
        tokenTransferFrom(msg.sender, lendingTokenAmount);

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            // Deposit tokens straight into Compound
            // Increase the Compound market supply
            compoundMarketState.increaseSupply(
                _depositToCompound(cTokenAddress, lendingTokenAmount)
            );
        } else {
            // Increase the market supply
            marketState.increaseSupply(lendingTokenAmount);
        }

        // Mint tToken tokens
        // The new lendingToken and tToken are in proportion to one another
        // So the exchange rate need not be updated again
        tTokenMint(msg.sender, tTokenAmount);

        // Emit event
        emit TokenDeposited(msg.sender, lendingTokenAmount, tTokenAmount);
    }

    /**
        @notice It allows any tToken holder to burn their tToken tokens and withdraw their tokens.
        @dev If the cToken is available (not 0x0), it withdraws the lending tokens from Compound before transferring the tokens to the holder.
        @param lendingTokenAmount of tokens to withdraw.
     */
    function withdraw(uint256 lendingTokenAmount)
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
        nonReentrant()
    {
        require(
            lendingToken.balanceOf(msg.sender) >= lendingTokenAmount,
            "LENDING_TOKEN_NOT_ENOUGH_BALANCE"
        );

        uint256 tTokenAmount = lendingTokenAmount.mul(EXCHANGE_RATE_SCALE).div(
            _exchangeRate()
        );

        // Burn tToken tokens.
        tToken.burn(msg.sender, tTokenAmount);

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            // Withdraw tokens from Compound
            // Decrease the Compound market supply
            compoundMarketState.decreaseSupply(
                _withdrawFromCompound(cTokenAddress, lendingTokenAmount)
            );
        } else {
            // Decrease the market supply
            marketState.decreaseSupply(lendingTokenAmount);
        }

        // Transfers tokens
        tokenTransfer(msg.sender, lendingTokenAmount);

        // Emit event.
        emit TokenWithdrawn(msg.sender, lendingTokenAmount, tTokenAmount);
    }

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
    ) external isInitialized() isLoan() whenLendingPoolNotPaused(address(this)) {
        uint256 totalAmount = principalAmount.add(interestAmount);

        // Transfers tokens to LendingPool.
        tokenTransferFrom(borrower, totalAmount);

        MarketStateLib.MarketState storage stateToUpdate = marketState;
        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            stateToUpdate = compoundMarketState;
            principalAmount = _depositToCompound(cTokenAddress, principalAmount);
            interestAmount = _depositToCompound(cTokenAddress, interestAmount);
        }

        if (principalAmount > 0) {
            stateToUpdate.increaseRepayment(principalAmount);
        }
        if (interestAmount > 0) {
            stateToUpdate.increaseSupply(interestAmount);
        }

        // Emits event.
        emit TokenRepaid(borrower, totalAmount);
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

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            // Deposit tokens straight into Compound
            // Increase the Compound market repayment
            compoundMarketState.increaseRepayment(
                _depositToCompound(cTokenAddress, amount)
            );
        } else {
            // Increase the market repayment
            marketState.increaseRepayment(amount);
        }

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
        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            // Withdraw tokens from Compound
            // Increase the Compound market borrowed amount
            compoundMarketState.increaseBorrow(
                _withdrawFromCompound(cTokenAddress, amount)
            );
        } else {
            // Increase the market borrowed amount
            marketState.increaseBorrow(amount);
        }

        // Transfer tokens to the borrower.
        tokenTransfer(borrower, amount);
    }

    function getMarketState() external view returns (MarketStateLib.MarketState memory) {
        return _getMarketState();
    }

    function getDebtRatioFor(uint256 loanAmount) external view returns (uint256) {
        return _getMarketState().getDebtRatioFor(loanAmount);
    }

    /**
        @notice Returns the cToken in the lending pool
        @return Address of the cToken
     */
    function cToken() public view returns (address) {
        return _getSettings().getCTokenAddress(address(lendingToken));
    }

    function exchangeRate() external view returns (uint256) {
        return _exchangeRate();
    }

    function _exchangeRate() internal view returns (uint256) {
        if (tToken.totalSupply() == 0) {
            return EXCHANGE_RATE_SCALE;
        }
        return
            _getMarketState().totalSupplied.mul(EXCHANGE_RATE_SCALE).div(
                tToken.totalSupply()
            );
    }

    /**
        @notice It initializes the contract state variables.
        @param tTokenAddress tToken token address.
        @param lendingTokenAddress ERC20 token address.
        @param loansAddress Loans contract address.
        @param settingsAddress Settings contract address.
        @dev It throws a require error if the contract is already initialized.
     */
    function initialize(
        address tTokenAddress,
        address lendingTokenAddress,
        address loansAddress,
        address settingsAddress
    ) external isNotInitialized() {
        tTokenAddress.requireNotEmpty("TTOKEN_ADDRESS_IS_REQUIRED");
        lendingTokenAddress.requireNotEmpty("TOKEN_ADDRESS_IS_REQUIRED");
        loansAddress.requireNotEmpty("LOANS_ADDRESS_IS_REQUIRED");

        _initialize(settingsAddress);

        tToken = TTokenInterface(tTokenAddress);
        lendingToken = IERC20Detailed(lendingTokenAddress);
        loans = loansAddress;
    }

    /** Internal functions */

    function _getMarketState()
        internal
        view
        returns (MarketStateLib.MarketState memory state)
    {
        state = marketState;

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0) && compoundMarketState.totalSupplied > 0) {
            state.totalSupplied = state.totalSupplied.add(
                CErc20Interface(cTokenAddress).valueInUnderlying(
                    compoundMarketState.totalSupplied
                )
            );
            state.totalRepaid = state.totalRepaid.add(
                CErc20Interface(cTokenAddress).valueInUnderlying(
                    compoundMarketState.totalRepaid
                )
            );
            state.totalBorrowed = state.totalBorrowed.add(
                CErc20Interface(cTokenAddress).valueInUnderlying(
                    compoundMarketState.totalBorrowed
                )
            );
        }
    }

    /**
        @notice It deposits a given amount of tokens to Compound only if the cToken is not empty.
        @param amount amount to deposit.
        @return the amount of tokens deposited.
     */
    function _depositToCompound(address cTokenAddress, uint256 amount)
        internal
        returns (uint256)
    {
        // approve the cToken contract to take lending tokens
        lendingToken.safeApprove(cTokenAddress, amount);

        uint256 balanceBefore = CErc20Interface(cTokenAddress).balanceOf(address(this));

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = CErc20Interface(cTokenAddress).mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");

        uint256 balanceAfter = CErc20Interface(cTokenAddress).balanceOf(address(this));
        return balanceAfter.sub(balanceBefore);
    }

    /**
        @notice It withdraws a given amount of tokens if the cToken is defined (not 0x0).
        @param amount amount of tokens to withdraw.
     */
    function _withdrawFromCompound(address cTokenAddress, uint256 amount)
        internal
        returns (uint256)
    {
        uint256 balanceBefore = CErc20Interface(cTokenAddress).balanceOf(address(this));

        // this function withdraws 'amount' lending tokens from compound
        // another function exists to withdraw 'amount' cTokens of lending tokens
        uint256 redeemResult = CErc20Interface(cTokenAddress).redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_REDEEM_UNDERLYING_ERROR");

        uint256 balanceAfter = CErc20Interface(cTokenAddress).balanceOf(address(this));
        return balanceBefore.sub(balanceAfter);
    }

    /**
        @notice It validates whether transaction sender is the loans contract address.@
        @dev This function is overriden in some mock contracts for testing purposes.
     */
    function _requireIsLoan() internal view {
        loans.requireEqualTo(msg.sender, "ADDRESS_ISNT_LOANS_CONTRACT");
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
        lendingToken.safeTransfer(recipient, amount);
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
        lendingToken.safeTransferFrom(from, address(this), amount);
    }

    /**
        @notice It mints tToken tokens, and send them to a specific address.
        @param to address which will receive the minted tokens.
        @param amount to be minted.
        @dev This contract must has a Minter Role in tToken (mintable) token.
        @dev It throws a require error if mint invocation fails.
     */
    function tTokenMint(address to, uint256 amount) private {
        bool mintResult = tToken.mint(to, amount);
        require(mintResult, "TTOKEN_MINT_FAILED");
    }
}
