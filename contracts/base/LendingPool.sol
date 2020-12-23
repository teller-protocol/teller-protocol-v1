pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/utils/Address.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/ERC20Detailed.sol";
import "../util/MarketStateLib.sol";
import "../util/AddressLib.sol";
import "../util/NumbersLib.sol";

// Commons

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LendersInterface.sol";
import "../interfaces/LoansInterface.sol";
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
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol. It is the contract that lenders interact with to deposit and withdraw their tokens including interest. The LendingPool interacts with the Lenders contract to ensure token balances and interest owed is kept up to date.

    @author develop@teller.finance
 */
contract LendingPool is Base, LendingPoolInterface {
    using SafeMath for uint256;
    using SafeERC20 for IERC20;
    using AddressLib for address;
    using Address for address;
    using MarketStateLib for MarketStateLib.MarketState;
    using NumbersLib for uint256;

    /** Constants */

    uint8 internal constant EXCHANGE_RATE_DECIMALS = 18;

    /* State Variables */

    IERC20 public lendingToken;

    TTokenInterface public tToken;

    LendersInterface public lenders;

    address public loans;

    /**
        @notice It maps:
        - The cToken address related with a given lent token => collateral token => Market state.
        - If the lent token is not supported by Compound, this function uses the lent token address as key.
        
        Examples (supported by Compound):
            address(cDAI) => address(LINK) => MarketState
            address(cUSDC) => address(LINK) => MarketState
        
        Examples (not supported by Compound):
            address(TokenA) => address(LINK) => MarketState
            address(TokenB) => address(ETH) => MarketState
     */
    mapping(address => mapping(address => MarketStateLib.MarketState)) public markets;

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

        // Mint tToken tokens
        tTokenMint(msg.sender, amount);

        _increaseSupply(
            LoansInterface(loans).collateralToken(),
            amount
        );

        // Emit event
        emit TokenDeposited(msg.sender, amount);
    }

    /**
        @notice It allows any tToken holder to burn their tToken tokens and withdraw their tokens.
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
        // Burn tToken tokens.
        tToken.burn(msg.sender, amount);

        // Withdraw the tokens from compound
        _withdrawFromCompoundIfSupported(amount);

        // Transfers tokens
        tokenTransfer(msg.sender, amount);

        _decreaseSupply(
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

        _increaseRepayment(
            LoansInterface(loans).collateralToken(),
            amount
        );

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

        _increaseRepayment(
            LoansInterface(loans).collateralToken(),
            amount
        );

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

        _increaseBorrow(
            LoansInterface(loans).collateralToken(),
            amount
        );
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
        InterestValidatorInterface interestValidator = _interestValidator();
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
        @notice Returns the cToken in the lending pool
        @return Address of the cToken
     */
    function cToken() public view returns (address) {
        return _getSettings().getCTokenAddress(address(lendingToken));
    }

    /**
        @notice It gets the supply-to-debt (StD) ratio for a given market, including a new loan amount.
        @param collateralAsset collateral asset address.
        @param loanAmount a new loan amount to consider in the ratio.
        @return the supply-to-debt ratio value.
     */
    function getSupplyToDebtFor(
        address collateralAsset,
        uint256 loanAmount
    ) external view returns (uint256) {
        address cTokenAddress = _getCTokenAddress();
        if (cTokenAddress.isEmpty()) {
            return markets[address(lendingToken)][collateralAsset].getSupplyToDebtFor(loanAmount);
        } else {
            return
                markets[cTokenAddress][collateralAsset].getSupplyToDebtFor(
                    _getValueForAmount(loanAmount)
                );
        }
    }

    /**
        @notice It gets the current market state.
        @param collateralAsset collateral asset address.
        @return the current market state.
     */
    function getMarket(address collateralAsset)
        external
        view
        returns (MarketStateLib.MarketState memory)
    {
        return _getMarket(collateralAsset);
    }

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
    ) external isNotInitialized() {
        tTokenAddress.requireNotEmpty("TTOKEN_ADDRESS_IS_REQUIRED");
        lendingTokenAddress.requireNotEmpty("TOKEN_ADDRESS_IS_REQUIRED");
        lendersAddress.requireNotEmpty("LENDERS_ADDRESS_IS_REQUIRED");
        loansAddress.requireNotEmpty("LOANS_ADDRESS_IS_REQUIRED");

        _initialize(settingsAddress);

        tToken = TTokenInterface(tTokenAddress);
        lendingToken = IERC20(lendingTokenAddress);
        lenders = LendersInterface(lendersAddress);
        loans = loansAddress;
    }

    /** Internal functions */

    /**
        @notice It deposits a given amount of tokens to Compound only if the cToken is not empty.
        @param amount amount to deposit.
        @return the amount of tokens deposited.
     */
    function _depositToCompoundIfSupported(uint256 amount) internal {
        address cTokenAddress = cToken();

        if (_isCTokenNotSupported(cTokenAddress)) {
            return;
        }

        // approve the cToken contract to take lending tokens
        lendingToken.safeApprove(cTokenAddress, amount);

        // Now mint cTokens, which will take lending tokens
        uint256 mintResult = CErc20Interface(cTokenAddress).mint(amount);
        require(mintResult == 0, "COMPOUND_DEPOSIT_ERROR");
    }

    /**
        @notice It withdraws a given amount of tokens if the cToken is defined (not 0x0).
        @param amount amount of tokens to withdraw.
     */
    function _withdrawFromCompoundIfSupported(uint256 amount) internal {
        address cTokenAddress = cToken();

        if (_isCTokenNotSupported(cTokenAddress)) {
            return;
        }

        // this function withdraws 'amount' lending tokens from compound
        // another function exists to withdraw 'amount' cTokens of lending tokens
        uint256 redeemResult = CErc20Interface(cTokenAddress).redeemUnderlying(amount);
        require(redeemResult == 0, "COMPOUND_REDEEM_UNDERLYING_ERROR");
    }

    /**
        @notice It tests whether cToken address is defined (not 0x0) or not.
        @return true if the cToken address is not 0x0. Otherwise it returns false.
     */
    function _isCTokenNotSupported(address cTokenAddress) internal pure returns (bool) {
        return cTokenAddress == address(0x0);
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

    /**
        @notice It increases the repayment amount for a given market.
        @notice This function is called every new repayment is received.
        @param collateralAsset collateral asset address.
        @param amount amount to add.
     */
    function _increaseRepayment(
        address collateralAsset,
        uint256 amount
    ) internal isInitialized() {
        amount = _getValueForAmount(amount);
        _getMarket(collateralAsset).increaseRepayment(amount);
    }

    /**
        @notice It increases the supply amount for a given market.
        @notice This function is called every new deposit (Lenders) is received.
        @param collateralAsset collateral asset address.
        @param amount amount to add.
     */
    function _increaseSupply(
        address collateralAsset,
        uint256 amount
    ) internal isInitialized() {
        amount = _getValueForAmount(amount);
        _getMarket(collateralAsset).increaseSupply(amount);
    }

    /**
        @notice It decreases the supply amount for a given market.
        @notice This function is called every new withdraw (Lenders) is done.
        @param collateralAsset collateral asset address.
        @param amount amount to decrease.
     */
    function _decreaseSupply(
        address collateralAsset,
        uint256 amount
    ) internal isInitialized() {
        amount = _getValueForAmount(amount);
        _getMarket(collateralAsset).decreaseSupply(amount);
    }

    /**
        @notice It increases the borrowed amount for a given market.
        @notice This function is called every new loan is taken out
        @param collateralAsset collateral asset address.
        @param amount amount to add.
     */
    function _increaseBorrow(
        address collateralAsset,
        uint256 amount
    ) internal isInitialized() {
        amount = _getValueForAmount(amount);
        _getMarket(collateralAsset).increaseBorrow(amount);
    }

    /**
        @notice It gets the current market state.
        @param collateralAsset collateral asset address.
        @return the current market state.
     */
    function _getMarket(address collateralAsset)
        internal
        view
        returns (MarketStateLib.MarketState storage)
    {
        address cTokenAddress = _getCTokenAddress();
        if (cTokenAddress.isEmpty()) {
            return markets[address(lendingToken)][collateralAsset];
        } else {
            return markets[cTokenAddress][collateralAsset];
        }
    }

    /**
        @notice It returns the value of an amount in cToken value
        @param amount The amount of the asset being converted
        @return uint256 The value of the inputed amount in it's cToken equivilant value
     */
    function _getValueForAmount(uint256 amount)
        internal
        view
        returns (uint256)
    {
        address cTokenAddress = _getCTokenAddress();
        if (cTokenAddress.isEmpty()) {
            return amount;
        } else {
            uint8 assetDecimals = ERC20Detailed(address(lendingToken)).decimals();
            uint8 cTokenDecimals = CErc20Interface(cTokenAddress).decimals();
            uint256 exchangeRate = CErc20Interface(cTokenAddress).exchangeRateStored();
            uint256 diffFactor = uint256(10) **
                uint256(EXCHANGE_RATE_DECIMALS).diff(uint256(cTokenDecimals));
            // return amount.mul(10**diffDecimals).div(exchangeRate);

            // int256 price;

            if (cTokenDecimals > EXCHANGE_RATE_DECIMALS) {
                exchangeRate = exchangeRate.mul(diffFactor);
            } else {
                exchangeRate = exchangeRate.div(diffFactor);
            }
            return amount.mul(exchangeRate).div(uint256(10)**assetDecimals);
        }
    }

    /**
        @notice Gets the cToken address associated to a borrowed asset.
        @return the cToken address (if Compound supported the asset). Otherwise it returns an empty address.
     */
    function _getCTokenAddress() internal view returns (address) {
        return _getSettings().getCTokenAddress(address(lendingToken));
    }
}
