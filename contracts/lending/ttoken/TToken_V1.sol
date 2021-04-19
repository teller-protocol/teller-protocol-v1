// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { InitArgs, CONTROLLER, ADMIN } from "./data.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Utils
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

// Interfaces
import { ITToken } from "./ITToken.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Libraries
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
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

    /* Modifiers */

    modifier authorized(bytes32 role) {
        require(hasRole(role, _msgSender()));
        _;
    }

    /**
     * @notice Checks if the LP is restricted or has the CONTROLLER role.
     *
     * The LP being restricted means that only the Teller protocol may
     *  lend/borrow funds.
     */
    modifier notRestricted {
        require(
            !_restricted || hasRole(CONTROLLER, _msgSender()),
            "Teller: platform restricted"
        );
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
     * @notice Deposit underlying token amount into LP and mint tokens.
     * @param amount The amount of underlying tokens to use to mint.
     */
    function mint(uint256 amount)
        external
        override
        notRestricted
        returns (uint256 mintAmount_)
    {
        require(amount > 0, "Teller: cannot mint 0");
        require(
            amount <= _underlying.balanceOf(_msgSender()),
            "Teller: insufficient underlying"
        );

        // Accrue interest and calculate exchange rate and total supply
        (uint256 rate, uint256 supply) = _exchangeRateSupply();
        require(supply + amount <= maxTVL, "Teller: max tvl exceeded");

        // Transfer tokens from lender
        SafeERC20.safeTransferFrom(
            _underlying,
            _msgSender(),
            address(this),
            amount
        );
        // Deposit tokens to Compound
        SafeERC20.safeIncreaseAllowance(_underlying, address(cToken), amount);
        cToken.mint(amount);

        // Calculate amount of tokens to mint
        mintAmount_ = _valueOfUnderlying(amount, rate);

        // Mint Teller token value of underlying
        _mint(_msgSender(), mintAmount_);

        emit Mint(_msgSender(), mintAmount_, amount);
    }

    /**
     * @notice Redeem supplied Teller token underlying value.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeem(uint256 amount) external override {
        require(amount > 0, "Teller: cannot withdraw 0");
        require(
            amount <= balanceOf(_msgSender()),
            "Teller: redeem amount exceeds balance"
        );

        // Accrue interest and calculate exchange rate
        uint256 underlyingAmount = _valueInUnderlying(amount, exchangeRate());

        // Burn Teller tokens
        _burn(_msgSender(), amount);

        // Claim tokens from Compound
        cToken.redeemUnderlying(underlyingAmount);

        // Transfer funds back to lender
        SafeERC20.safeTransfer(_underlying, _msgSender(), underlyingAmount);

        emit Redeem(_msgSender(), amount, underlyingAmount);
    }

    /**
     * @notice Redeem supplied underlying value.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount) external override {
        require(amount > 0, "Teller: cannot withdraw 0");

        // Accrue interest and calculate exchange rate
        uint256 rate = exchangeRate();
        uint256 tokenValue = _valueOfUnderlying(amount, rate);

        // Make sure sender has adequate balance
        require(
            tokenValue <= balanceOf(_msgSender()),
            "Teller: redeem amount exceeds balance"
        );

        // Burn Teller tokens
        _burn(_msgSender(), tokenValue);

        // Claim tokens from Compound
        cToken.redeemUnderlying(amount);

        // Transfer funds back to lender
        SafeERC20.safeTransfer(_underlying, _msgSender(), amount);

        emit Redeem(_msgSender(), tokenValue, amount);
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

        _setupRole(CONTROLLER, args.controller);
        _setupRole(ADMIN, _msgSender());

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
    function restrict(bool state) public override authorized(ADMIN) {
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
}
