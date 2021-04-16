// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Utils
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import { ITToken } from "./ITToken.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

/**
 * @notice This contract represents a wrapped token within the Teller protocol
 *
 * @author develop@teller.finance
 */
contract TToken_V1 is ITToken {
    /* State Variables */

    uint256 public constant EXCHANGE_RATE_FACTOR = 1e18;
    uint256 public constant ONE_HUNDRED_PERCENT = 10000;

    ICErc20 public cToken;
    ERC20 private _underlying;
    uint8 private _decimals;
    bool private _restricted;

    // LP settings
    uint256 public maxTVL;

    // Supply data
    uint256 public lenderTotalSupplied;
    uint256 public lenderTotalInterest;
    uint256 public totalInterestEarned;

    /* Modifiers */

    modifier isNotRestricted {
        require(!_restricted, "Teller: platform restricted");
        _;
    }

    /* Public Functions */

    function decimals() public view override returns (uint8 decimals_) {
        decimals_ = _decimals;
    }

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() public view override returns (ERC20 underlying_) {
        underlying_ = _underlying;
    }

    /**
     * @notice The balance of an {account} denoted in underlying value.
     */
    function balanceOfUnderlying(address account)
        public
        override
        returns (uint256 balance_)
    {
        balance_ = _valueInUnderlying(balanceOf(account), exchangeRate());
    }

    /**
     * @notice Increase account supply of specified token amount
     * @param amount The amount of tokens to mint
     */
    function mint(uint256 amount) external override isNotRestricted {
        _deposit(_msgSender(), amount);
    }

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens to
     * @param amount The amount of tokens to mint
     *
     * Restrictions:
     *  - Caller must be the owner
     */
    function mintOnBehalf(address account, uint256 amount)
        external
        override
        onlyOwner
    {
        _deposit(account, amount);
    }

    function _deposit(address account, uint256 amount) internal {
        require(amount > 0, "Teller: cannot mint 0");
        require(
            amount <= _underlying.balanceOf(account),
            "Teller: insufficient underlying"
        );

        // Accrue interest and calculate exchange rate and total supply
        (uint256 rate, uint256 supply) = _exchangeRateSupply();
        require(supply + amount <= maxTVL, "Teller: max tvl exceeded");

        // Transfer tokens from lender
        _underlying.transferFrom(account, address(this), amount);
        // Update lender data
        lenderTotalSupplied[account] += amount;

        // Mint Teller token value of underlying
        _mint(account, _valueOfUnderlying(amount, rate));
    }

    /**
     * @notice Redeem supplied Teller token underlying value.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeem(uint256 amount) external override isNotRestricted {
        // Accrue interest and calculate exchange rate
        // Redeem Teller tokens for underlying
        _redeem(_msgSender(), amount, exchangeRate());
    }

    /**
     * @notice Redeem supplied Teller token value.
     * @param account The account to redeem tokens for.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeemOnBehalf(address account, uint256 amount)
        external
        override
        onlyOwner
    {
        // Accrue interest and calculate exchange rate
        // Redeem Teller tokens for underlying
        _redeem(account, amount, exchangeRate());
    }

    /**
     * @notice Redeem supplied underlying value.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount)
        external
        override
        isNotRestricted
    {
        // Accrue interest and calculate exchange rate
        uint256 rate = exchangeRate();
        // Calculate underlying amount value in Teller tokens and redeem
        _redeem(_msgSender(), _valueOfUnderlying(amount, rate), rate);
    }

    /**
     * @notice Redeem supplied underlying value.
     * @param account The account to redeem tokens for.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlyingOnBehalf(address account, uint256 amount)
        external
        override
        onlyOwner
    {
        // Accrue interest and calculate exchange rate
        uint256 rate = exchangeRate();
        // Calculate underlying amount value in Teller tokens and redeem
        _redeem(account, _valueOfUnderlying(amount, rate), rate);
    }

    function _redeem(
        address account,
        uint256 amount,
        uint256 rate
    ) internal {
        require(amount > 0, "Teller: cannot withdraw 0");
        require(
            amount <= balanceOf(account),
            "Teller: redeem amount exceeds balance"
        );

        // Update lender interest data
        uint256 lenderInterestEarned = _calcLenderInterestEarned(account, rate);
        lenderTotalInterest[account] += lenderInterestEarned;
        totalInterestEarned[account] += lenderInterestEarned;

        // Update lender supplied data
        if (amount > lenderInterestEarned) {
            lenderTotalSupplied[account] -= amount - lenderInterestEarned;
        } else {
            lenderTotalSupplied[account] += lenderInterestEarned - amount;
        }

        // Burn Teller tokens
        _burn(account, _valueOfUnderlying(amount, rate));

        // Transfer funds back to lender
        _underlying.transfer(account, amount);
    }

    /**
     * @notice Initializes the Teller token
     */
    function initialize(InitArgs calldata args) external override initializer {
        require(
            Address.isContract(args.controller),
            "Teller: controller not contract"
        );
        require(
            Address.isContract(args.underlying),
            "Teller: underlying token not contract"
        );

        // Make the TellerDiamond the owner instead of caller
        __Ownable_init();
        transferOwnership(args.controller);

        cToken = ICErc20(args.cToken);
        _underlying = ERC20(args.underlying);
        __ERC20_init(
            string(abi.encodePacked("Teller ", _underlying.name())),
            string(abi.encodePacked("t", _underlying.symbol()))
        );
        _decimals = _underlying.decimals();
        // Platform restricted by default
        _restricted = true;

        maxTVL = args.maxTVL;
    }

    /**
     * @notice Sets the restricted state of the platform.
     */
    function restrict(bool state) public onlyOwner {
        _restricted = state;
    }

    /**
     * @dev
     */
    function _valueOfUnderlying(uint256 amount, uint256 rate)
        internal
        pure
        returns (uint256 value_)
    {
        value_ = (amount * EXCHANGE_RATE_FACTOR) / rate;
    }

    /**
     * @dev
     */
    function _valueInUnderlying(uint256 amount, uint256 rate)
        internal
        pure
        returns (uint256 value_)
    {
        value_ = (amount * (rate)) / EXCHANGE_RATE_FACTOR;
    }

    /**
     * @dev
     */
    function _exchangeRateSupply()
        internal
        returns (uint256 rate_, uint256 supply_)
    {
        accrueInterest();
        if (totalSupply() == 0) {
            rate_ = EXCHANGE_RATE_FACTOR;
        } else {
            supply_ = totalUnderlyingSupply();
            rate_ = _exchangeRateForSupply(supply_);
        }
    }

    /**
     * @dev
     */
    function _exchangeRateForSupply(uint256 supply)
        internal
        view
        returns (uint256 rate_)
    {
        rate_ = (supply * EXCHANGE_RATE_FACTOR) / totalSupply();
    }

    /**
     * @dev
     */
    function exchangeRate() public returns (uint256 rate_) {
        if (totalSupply() == 0) {
            return EXCHANGE_RATE_FACTOR;
        }

        accrueInterest();
        rate_ = _exchangeRateForSupply(totalUnderlyingSupply());
    }

    /**
     * @dev
     */
    function accrueInterest() public {
        cToken.accrueInterest();
    }

    /**
     * @notice It calculates the total supply of the underlying asset.
     * @return totalSupply_ the total supply denoted in the underlying asset.
     */
    function totalUnderlyingSupply()
        public
        override
        returns (uint256 totalSupply_)
    {
        // Get underlying balance from Compound
        totalSupply_ += cToken.balanceOfUnderlying(address(this));
    }

    function _calcLenderInterestEarned(address lender, uint256 rate)
        internal
        view
        returns (uint256 interest_)
    {
        interest_ =
            _valueInUnderlying(balanceOf(lender), rate) -
            lenderTotalSupplied[lender];
    }
}
