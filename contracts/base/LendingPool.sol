pragma solidity 0.5.17;
pragma experimental ABIEncoderV2;

// Libraries
import "../util/CompoundRatesLib.sol";
import "../util/NumbersLib.sol";
import "../util/AddressArrayLib.sol";

// Commons

// Interfaces
import "@openzeppelin/contracts-ethereum-package/contracts/token/ERC20/SafeERC20.sol";
import "@openzeppelin/contracts-ethereum-package/contracts/math/SafeMath.sol";
import "../interfaces/LendingPoolInterface.sol";
import "../interfaces/LoansInterface.sol";
import "../providers/compound/CErc20Interface.sol";
import "../interfaces/IMarketRegistry.sol";

// Contracts
import "./Base.sol";
import "./TToken.sol";

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
    @notice The LendingPool contract holds all of the tokens that lenders transfer into the protocol.
    It is the contract that lenders interact with to deposit and withdraw their tokens including interest.

    @author develop@teller.finance
 */
contract LendingPool is Base, LendingPoolInterface {
    using SafeMath for uint256;
    using SafeERC20 for ERC20Detailed;
    using CompoundRatesLib for CErc20Interface;
    using NumbersLib for uint256;

    /* State Variables */

    TToken public tToken;

    ERC20Detailed public lendingToken;

    uint8 public constant EXCHANGE_RATE_DECIMALS = 36;

    IMarketRegistry public marketRegistry;

    uint256 internal _totalBorrowed;

    uint256 internal _totalRepaid;

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
        require(
            _getTotalSupplied() <=
                _getSettings().assetSettings().getMaxTVLAmount(address(lendingToken)),
            "MAX_TVL_REACHED"
        );
        uint256 tTokenAmount = _tTokensForLendingTokens(lendingTokenAmount);

        // Transfering tokens to the LendingPool
        tokenTransferFrom(msg.sender, lendingTokenAmount);

        address cTokenAddress = cToken();
        if (
            cTokenAddress != address(0) &&
            CErc20Interface(cTokenAddress).valueOfUnderlying(lendingTokenAmount) > 0
        ) {
            _depositToCompound(cTokenAddress, lendingTokenAmount);
        }

        // Mint tToken tokens
        tTokenMint(msg.sender, tTokenAmount);

        // Emit event
        emit TokenDeposited(msg.sender, lendingTokenAmount, tTokenAmount);
    }

    /**
        @notice It allows any tToken holder to burn their tToken tokens and withdraw their tokens.
        @dev If the cToken is available (not 0x0), it withdraws the lending tokens from Compound before
        transferring the tokens to the holder.
        @param lendingTokenAmount of tokens to withdraw.
     */
    function withdraw(uint256 lendingTokenAmount)
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
        nonReentrant()
    {
        uint256 tTokenAmount = _tTokensForLendingTokens(lendingTokenAmount);

        require(tTokenAmount > 0, "WITHDRAW_TTOKEN_DUST");
        require(tToken.balanceOf(msg.sender) > tTokenAmount, "TTOKEN_NOT_ENOUGH_BALANCE");

        _withdraw(lendingTokenAmount, tTokenAmount);
    }

    function withdrawAll()
        external
        isInitialized()
        whenNotPaused()
        whenLendingPoolNotPaused(address(this))
        nonReentrant()
        returns (uint256)
    {
        uint256 tTokenAmount = tToken.balanceOf(msg.sender);
        uint256 lendingTokenAmount = _lendingTokensForTTokens(tTokenAmount);

        _withdraw(lendingTokenAmount, tTokenAmount);

        return lendingTokenAmount;
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
        require(totalAmount > 0, "REPAY_ZERO");

        // Transfers tokens to LendingPool.
        tokenTransferFrom(borrower, totalAmount);

        _totalRepaid = _totalRepaid.add(principalAmount);

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            _depositToCompound(cTokenAddress, totalAmount);
        }

        // Emits event.
        emit TokenRepaid(borrower, totalAmount);
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
        uint256 lendingTokenBalance = lendingToken.balanceOf(address(this));
        if (lendingTokenBalance < amount) {
            address cTokenAddress = cToken();
            if (cTokenAddress != address(0)) {
                _withdrawFromCompound(cTokenAddress, amount.sub(lendingTokenBalance));
            }
        }

        // Transfer tokens to the borrower.
        tokenTransfer(borrower, amount);

        _totalBorrowed = _totalBorrowed.add(amount);
    }

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
            uint256 totalRepaid
        )
    {
        return _getMarketState();
    }

    /**
        @notice It gets the supply-to-debt (StD) ratio for a given market, including a new loan amount.
        @notice The formula to calculate StD ratio (including a new loan amount) is:

            StD = (SUM(total borrowed) - SUM(total repaid) + NewLoanAmount) / SUM(total supplied)

        @notice The value has 2 decimal places.
            Example:
                100 => 1%
        @param loanAmount a new loan amount to consider in the ratio.
        @return the supply-to-debt ratio value.
     */
    function getDebtRatioFor(uint256 loanAmount) external view returns (uint256) {
        uint256 totalSupplied = _getTotalSupplied();
        return
            totalSupplied == 0
                ? 0
                : _totalBorrowed.add(loanAmount).sub(_totalRepaid).ratioOf(totalSupplied);
    }

    /**
        @notice Returns the cToken in the lending pool
        @return Address of the cToken
     */
    function cToken() public view returns (address) {
        return _getSettings().getCTokenAddress(address(lendingToken));
    }

    /**
        @notice It calculates the current exchange rate for the TToken based on the total supply of the lending token.
        @return the exchange rate for 1 TToken to the underlying token.
     */
    function exchangeRate() external view returns (uint256) {
        return _exchangeRate();
    }

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
    ) external isNotInitialized() {
        address(aTToken).requireNotEmpty("TTOKEN_ADDRESS_IS_REQUIRED");

        _initialize(settingsAddress);

        marketRegistry = aMarketRegistry;
        tToken = aTToken;
        lendingToken = tToken.underlying();
    }

    /** Internal functions */

    /**
        @notice It calculates the current exchange rate for the TToken based on the total supply of the lending token.
        @return the exchange rate for 1 TToken to the underlying token.
     */
    function _exchangeRate() internal view returns (uint256) {
        if (tToken.totalSupply() == 0) {
            return uint256(10)**uint256(int8(EXCHANGE_RATE_DECIMALS));
        }

        return
            _getTotalSupplied()
                .add(_totalBorrowed)
                .sub(_totalRepaid)
                .mul(uint256(10)**uint256(EXCHANGE_RATE_DECIMALS))
                .div(tToken.totalSupply());
    }

    /**
        @notice It calculates the market state values across all markets.
        @return values that represent the global state across all markets.
     */
    function _getMarketState()
        internal
        view
        returns (
            uint256 totalSupplied,
            uint256 totalBorrowed,
            uint256 totalRepaid
        )
    {
        totalSupplied = _getTotalSupplied();
        totalBorrowed = _totalBorrowed;
        totalRepaid = _totalRepaid;
    }

    /**
        @notice It calculates the total supply of the lending token across all markets.
        @return the total supply denoted in the lending token.
     */
    function _getTotalSupplied() internal view returns (uint256 totalSupplied) {
        totalSupplied = lendingToken.balanceOf(address(this));

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            totalSupplied = totalSupplied.add(
                CErc20Interface(cTokenAddress).valueInUnderlying(
                    CErc20Interface(cTokenAddress).balanceOf(address(this))
                )
            );
        }
    }

    function _withdraw(uint256 lendingTokenAmount, uint256 tTokenAmount) internal {
        uint256 lendingTokenBalance = lendingToken.balanceOf(address(this));

        address cTokenAddress = cToken();
        if (cTokenAddress != address(0)) {
            _withdrawFromCompound(
                cTokenAddress,
                lendingTokenAmount.sub(lendingTokenBalance)
            );
        }

        // Burn tToken tokens.
        tToken.burn(msg.sender, tTokenAmount);

        // Transfers tokens
        tokenTransfer(msg.sender, lendingTokenAmount);

        // Emit event.
        emit TokenWithdrawn(msg.sender, lendingTokenAmount, tTokenAmount);
    }

    function _tTokensForLendingTokens(uint256 lendingTokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            lendingTokenAmount.mul(uint256(10)**uint256(EXCHANGE_RATE_DECIMALS)).div(
                _exchangeRate()
            );
    }

    function _lendingTokensForTTokens(uint256 tTokenAmount)
        internal
        view
        returns (uint256)
    {
        return
            tTokenAmount.mul(_exchangeRate()).div(
                uint256(10)**uint256(EXCHANGE_RATE_DECIMALS)
            );
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
        uint256 difference = balanceAfter.sub(balanceBefore);
        require(difference > 0, "DEPOSIT_CTOKEN_DUST");

        return difference;
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
        @notice It validates whether transaction sender is the loans contract address.
        @dev This function is overriden in some mock contracts for testing purposes.
     */
    function _requireIsLoan() internal view {
        require(
            marketRegistry.loansRegistry(address(this), msg.sender),
            "ADDRESS_ISNT_LOANS_CONTRACT"
        );
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
