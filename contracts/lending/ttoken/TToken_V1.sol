// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { InitArgs, CONTROLLER, ADMIN, Hook, HelperConfig } from "./data.sol";
import "./storage.sol" as Storage;
import "./Ticketed.sol";

import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Utils
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Interfaces
import { ITToken } from "./ITToken.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Libraries
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { MaxDebtRatioLib } from "../../settings/asset/MaxDebtRatioLib.sol";
import { MaxLoanAmountLib } from "../../settings/asset/MaxLoanAmountLib.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    ReentryMods
} from "../../contexts2/access-control/reentry/ReentryMods.sol";

error HookDelegateCallFailed(string);

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
 *
 * @author develop@teller.finance
 */
contract TToken_V1 is ITToken, ReentryMods {
    using NumbersLib for uint256;
    using EnumerableSet for EnumerableSet.Set;

    /* State Variables */
    uint256 public constant EXCHANGE_RATE_FACTOR = 1e18;
    uint256 public constant ONE_HUNDRED_PERCENT = 10000;

    function() internal pure returns (Storage.Store storage)
        private constant S = Storage.store;

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
            !S().restricted || hasRole(CONTROLLER, _msgSender()),
            "Teller: platform restricted"
        );
        _;
    }

    /* Public Functions */

    function cToken() public view returns (ICErc20 cToken_) {
        cToken_ = S().cToken;
    }

    function decimals() public view override returns (uint8 decimals_) {
        decimals_ = S().decimals;
    }

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() public view override returns (ERC20 underlying_) {
        underlying_ = S().underlying;
    }

    /**
     * @notice The balance of an {account} denoted in underlying value.
     */
    function balanceOfUnderlying(address account)
        public
        view
        override
        returns (uint256 balance_)
    {
        balance_ = _valueInUnderlying(balanceOf(account), _exchangeRate());
    }

    modifier hook(bool pre, Hook memory _hook) {
        // Strategy might not be managed through hooks.
        if (_hook.target == address(0)) return;
        // We should run the function body before the core of the modifier.
        if (!pre) _;
        // Selector defined by the hook config, data is static and forward msg.data.
        bytes memory data = bytes.concat(_hook.selector, _hook.data, msg.data);
        // Delegate call and handle response.
        (bool success, bytes memory result) = _hook.target.delegatecall(data);
        if (!success) revert(string(result));
        // We should run the function body after the core of the modifier.
        if (pre) _;
    }

    /**
        Take underlying token from the pool at this address and send it
        to a loan contract.
        @param recipient of the funds.
        @param amount sent to recipient.
     */
    function fundLoan(address recipient, uint256 amount)
        external
        override
        authorized(CONTROLLER)
        hook(true, S().hooks.withdraw)
    {
        // Transfer tokens to recipient
        SafeERC20.safeTransfer(S().underlying, recipient, amount);
    }

    /**
     * @notice Deposit underlying token amount into LP and mint tokens.
     * @param amount The amount of underlying tokens to use to mint.
     */
    function mint(uint256 amount)
        external
        override
        notRestricted
        hook(false, S().hooks.deposit)
        returns (uint256 mintAmount_)
    {
        require(amount > 0, "Teller: cannot mint 0");
        require(
            amount <= S().underlying.balanceOf(_msgSender()),
            "Teller: insufficient underlying"
        );
        // Calculate amount of tokens to mint
        mintAmount_ = _valueOfUnderlying(amount, _exchangeRate());

        // Transfer tokens from lender
        SafeERC20.safeTransferFrom(
            S().underlying,
            _msgSender(),
            address(this),
            amount
        );

        // Mint Teller token value of underlying
        _mint(_msgSender(), mintAmount_);
        emit Mint(_msgSender(), mintAmount_, amount);
    }

    /**
     * @notice Redeem supplied Teller token underlying value.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeem(uint256 amount) external override hook(true, S().hooks.withdraw) {
        require(amount > 0, "Teller: cannot withdraw 0");
        require(
            amount <= balanceOf(_msgSender()),
            "Teller: redeem amount exceeds balance"
        );

        uint256 underlyingAmount = _valueInUnderlying(amount, _exchangeRate());
        require(
            underlyingAmount <= S().underlying.balanceOf(address(this)),
            "Teller: redeem ttoken lp not enough supply"
        );

        // Burn Teller tokens
        _burn(_msgSender(), amount);

        // Transfer funds back to lender
        SafeERC20.safeTransfer(S().underlying, _msgSender(), underlyingAmount);

        emit Redeem(_msgSender(), amount, underlyingAmount);
    }

    /**
     * @notice Redeem supplied underlying value.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount) external override  hook(true, S().hooks.withdraw) {
        require(amount > 0, "Teller: cannot withdraw 0");
        require(
            amount <= totalUnderlyingSupply(),
            "Teller: redeem ttoken lp not enough supply"
        );

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

        // Transfer funds back to lender
        SafeERC20.safeTransfer(S().underlying, _msgSender(), amount);

        emit Redeem(_msgSender(), tokenValue, amount);
    }

    function configureHooks(Storage.HookConfig memory hooks)
        external
        override
        authorized(ADMIN)
    {
        S().hooks = hooks;
    }

    function configureHelper(HelperConfig memory helperConfig) external override authorized(ADMIN) {
        S().helper = helperConfig;
    }

    function help(bytes calldata input) external override returns (bytes memory output) {
        bool success;
        (success, output) = S().helper.target.delegatecall(bytes.concat(S().helper.selector, input));
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
        _setupRole(ADMIN, args.admin);

        S().cToken = ICErc20(args.cToken);
        S().underlying = ERC20(args.underlying);
        __ERC20_init(
            string(abi.encodePacked("Teller ", S().underlying.name())),
            string(abi.encodePacked("t", S().underlying.symbol()))
        );
        S().decimals = S().underlying.decimals();
        // Platform restricted by default
        S().restricted = true;
        if (args.helperConfig.target != address(0)) S().helper = args.helperConfig;
        if ((args.hookConfig.withdraw.selector | args.hookConfig.deposit.selector) != bytes4(0)) S().hooks = args.hookConfig;
    }

    function exchangeRate() public view returns (uint256 rate_) {
        rate_ = _exchangeRate();
    }

    /**
     * @notice Sets the restricted state of the platform.
     */
    function restrict(bool state) public override authorized(ADMIN) {
        S().restricted = state;
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

    function _exchangeRate() internal view returns (uint256 rate_) {
        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            rate_ = EXCHANGE_RATE_FACTOR;
        } else {
            rate_ = (totalUnderlyingSupply()) * EXCHANGE_RATE_FACTOR / _totalSupply;
        }
    }

    /**
     * @dev Accrues interest earned by this TToken and its lenders on compound.
     */
    function accrueInterest() public {
        S().cToken.accrueInterest();
    }

    /**
     * @notice It calculates the total supply of the underlying asset.
     * @return totalSupply_ the total supply denoted in the underlying asset.
     */
    function totalUnderlyingSupply()
        public
        view
        override
        returns (uint256 totalSupply_)
    {
        // Get underlying balance from Compound
        totalSupply_ =
            S().underlying.balanceOf(address(this)) +
            (S().cToken.balanceOf(address(this)) *
                S().cToken.exchangeRateStored()) /
            1e18;
    }
}
