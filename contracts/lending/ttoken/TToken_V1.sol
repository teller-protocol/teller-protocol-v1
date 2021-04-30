// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    CONTROLLER,
    ADMIN,
    EXCHANGE_RATE_FACTOR,
    ONE_HUNDRED_PERCENT
} from "./data.sol";
import { ITTokenStrategy } from "./strategies/ITTokenStrategy.sol";
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
import {
    ERC165Checker
} from "@openzeppelin/contracts/utils/introspection/ERC165Checker.sol";
import { RolesLib } from "../../contexts2/access-control/roles/RolesLib.sol";

// Storage
import "./storage.sol" as Storage;

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
 *
 * @author develop@teller.finance
 */
contract TToken_V1 is ITToken {
    function() pure returns (Storage.Store storage) private constant s =
        Storage.store;

    /* Modifiers */

    /**
     * @notice Checks if the LP is restricted or has the CONTROLLER role.
     *
     * The LP being restricted means that only the Teller protocol may
     *  lend/borrow funds.
     */
    modifier notRestricted {
        require(
            !s().restricted || RolesLib.hasRole(CONTROLLER, _msgSender()),
            "Teller: platform restricted"
        );
        _;
    }

    /* Public Functions */

    function decimals() public view override returns (uint8) {
        return s().decimals;
    }

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() public view override returns (ERC20) {
        return s().underlying;
    }

    /**
     * @notice The balance of an {account} denoted in underlying value.
     */
    function balanceOfUnderlying(address account)
        public
        override
        returns (uint256)
    {
        return _valueInUnderlying(balanceOf(account), exchangeRate());
    }

    function fundLoan(address recipient, uint256 amount)
        external
        override
        authorized(CONTROLLER, _msgSender())
    {
        // If TToken is not holding enough funds to cover the loan, call the strategy to try to withdraw
        uint256 balance = s().underlying.balanceOf(address(this));
        if (balance < amount) {
            _delegateStrategy(
                abi.encodeWithSelector(
                    ITTokenStrategy.withdraw.selector,
                    amount - balance
                )
            );
        }

        // Transfer tokens to recipient
        SafeERC20.safeTransfer(s().underlying, recipient, amount);
    }

    /**
     * @notice Deposit underlying token amount into LP and mint tokens.
     * @param amount The amount of underlying tokens to use to mint.
     * @return Amount of TTokens minted.
     */
    function mint(uint256 amount)
        external
        override
        notRestricted
        returns (uint256)
    {
        require(amount > 0, "Teller: cannot mint 0");
        require(
            amount <= s().underlying.balanceOf(_msgSender()),
            "Teller: insufficient underlying"
        );

        // Calculate amount of tokens to mint
        uint256 mintAmount = _valueOfUnderlying(amount, exchangeRate());

        // Transfer tokens from lender
        SafeERC20.safeTransferFrom(
            s().underlying,
            _msgSender(),
            address(this),
            amount
        );

        // Mint Teller token value of underlying
        _mint(_msgSender(), mintAmount);

        emit Mint(_msgSender(), mintAmount, amount);

        return mintAmount;
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
        require(
            underlyingAmount <= totalUnderlyingSupply(),
            "Teller: redeem ttoken lp not enough supply"
        );

        // Burn Teller tokens
        _burn(_msgSender(), amount);

        // Make sure enough funds are available to redeem
        _delegateStrategy(
            abi.encodeWithSelector(
                ITTokenStrategy.withdraw.selector,
                underlyingAmount
            )
        );

        // Transfer funds back to lender
        SafeERC20.safeTransfer(s().underlying, _msgSender(), underlyingAmount);

        emit Redeem(_msgSender(), amount, underlyingAmount);
    }

    /**
     * @notice Redeem supplied underlying value.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount) external override {
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

        // Make sure enough funds are available to redeem
        _delegateStrategy(
            abi.encodeWithSelector(ITTokenStrategy.withdraw.selector, amount)
        );

        // Transfer funds back to lender
        SafeERC20.safeTransfer(s().underlying, _msgSender(), amount);

        emit Redeem(_msgSender(), tokenValue, amount);
    }

    function _redeem(uint256 underlyingAmount) internal {}

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

        RolesLib.grantRole(CONTROLLER, args.controller);
        RolesLib.grantRole(ADMIN, args.admin);

        s().underlying = ERC20(args.underlying);
        __ERC20_init(
            string(abi.encodePacked("Teller ", s().underlying.name())),
            string(abi.encodePacked("t", s().underlying.symbol()))
        );
        s().decimals = s().underlying.decimals();
        // Platform restricted by default
        s().restricted = true;
    }

    /**
     * @notice Sets the restricted state of the platform.
     */
    function restrict(bool state)
        public
        override
        authorized(ADMIN, _msgSender())
    {
        s().restricted = state;
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
    function exchangeRate() public override returns (uint256 rate_) {
        if (totalSupply() == 0) {
            return EXCHANGE_RATE_FACTOR;
        }

        rate_ = _exchangeRateForSupply(totalUnderlyingSupply());
    }

    /**
     * @notice It calculates the total supply of the underlying asset.
     * @return totalSupply_ the total supply denoted in the underlying asset.
     */
    function totalUnderlyingSupply() public override returns (uint256) {
        bytes memory data =
            _delegateStrategy(
                abi.encodeWithSelector(
                    ITTokenStrategy.totalUnderlyingSupply.selector
                )
            );
        return abi.decode(data, (uint256));
    }

    /**
     * @notice Calls the current strategy to rebalance the funds based on its defined rules.
     */
    function rebalance() public override {
        _delegateStrategy(
            abi.encodeWithSelector(ITTokenStrategy.rebalance.selector)
        );
    }

    /**
     * @notice Sets a new strategy to use for balancing funds.
     * @param strategy Address to the new strategy contract. Must implement the {ITTokenStrategy} interface.
     * @param initData Optional data to initialize the strategy.
     *
     * Requirements:
     *  - Sender must have ADMIN role
     */
    function setStrategy(address strategy, bytes calldata initData)
        external
        override
        authorized(ADMIN, _msgSender())
    {
        require(
            ERC165Checker.supportsInterface(
                strategy,
                type(ITTokenStrategy).interfaceId
            ),
            "Teller: strategy does not support ITTokenStrategy"
        );
        s().strategy = strategy;
        if (initData.length > 0) {
            _delegateStrategy(initData);
        }
    }

    /**
     * @notice Delegates data to call on the strategy contract.
     * @param callData Data to call the strategy contract with.
     *
     * Requirements:
     *  - Sender must have ADMIN role
     */
    function _delegateStrategy(bytes memory callData)
        internal
        returns (bytes memory)
    {
        return Address.functionDelegateCall(s().strategy, callData);
    }
}
