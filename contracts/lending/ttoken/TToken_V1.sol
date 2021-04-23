// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { InitArgs, CONTROLLER, ADMIN } from "./data.sol";
import "./storage.sol" as Storage;
import "./Ticketed.sol";

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
import { MaxDebtRatioLib } from "../../settings/asset/MaxDebtRatioLib.sol";
import { MaxLoanAmountLib } from "../../settings/asset/MaxLoanAmountLib.sol";
import { NumbersLib } from "../../shared/libraries/NumbersLib.sol";
import {
    ReentryMods
} from "../../contexts2/access-control/reentry/ReentryMods.sol";

/**
 * @notice This contract represents a lending pool for an asset within Teller protocol.
 *
 * @author develop@teller.finance
 */
contract TToken_V1 is ITToken, ReentryMods {
    using NumbersLib for uint256;

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
        Initial implementation/experimentation with metamorphic contracts/storage
        as the controllers for deposit/withdraw/etc. hooks from TTokens.
    */
    // modifier strategized(int256 amountIn) {
    //     uint256 balanceBefore = underlying().balanceOf(address(this));
    //     if (amountIn < 0 && int256(balanceBefore) + amountIn < 0) {
    //         // We don't have enough
    //         S().strategist.rug()
    //     }
    //     _;
    //     (bool success, bytes memory result) =
    //         STRATEGIST.delegatecall(
    //             balanceBefore,
    //             underlying().balanceOf(address(this))
    //         );
    // }

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
        TODO: make these view functions, just getting the exchange rate stored
        from compound to save on some gas.
        We will be accruing interest and calling compound during rebalance().
     */
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
        TODO: try/catch transfer calls which fail due to not having the balance
        in this contract, but instead it being on compound.
        Can return a nice message to the user and have them click on a button to
        get a reward for fixing the issue + getting their tx through.
     */
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
    {
        // Claim tokens from Compound
        // S().cToken.redeemUnderlying(amount);
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
        returns (uint256 mintAmount_)
    {
        require(amount > 0, "Teller: cannot mint 0");
        require(
            amount <= S().underlying.balanceOf(_msgSender()),
            "Teller: insufficient underlying"
        );

        // Calculate amount of tokens to mint
        // TODO: just use standard exchange rate not compound accrued one.
        mintAmount_ = _valueOfUnderlying(amount, exchangeRate());

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
    function redeem(uint256 amount) external override {
        require(amount > 0, "Teller: cannot withdraw 0");
        require(
            amount <= balanceOf(_msgSender()),
            "Teller: redeem amount exceeds balance"
        );

        // TODO: don't accrue interest here and just do it in rebalance
        uint256 underlyingAmount = _valueInUnderlying(amount, exchangeRate());
        require(
            underlyingAmount <= S().underlying.balanceOf(address(this)),
            "Teller: redeem ttoken lp not enough supply"
        );

        // Burn Teller tokens
        _burn(_msgSender(), amount);
        // Claim tokens from Compound
        // S().cToken.redeemUnderlying(underlyingAmount);

        // Transfer funds back to lender
        SafeERC20.safeTransfer(S().underlying, _msgSender(), underlyingAmount);

        emit Redeem(_msgSender(), amount, underlyingAmount);
    }

    /**
        This is untested for now, but basically just fill up a bytes32 with
        relevant data so that later we can parse it and reward the user accurately.
        See {Ticketed} abstract contract for more details.
     */
    function ticketId(bytes4 selector) internal view returns (bytes32 id_) {
        assembly {
            id_ := shl(or(id_, selector), 224)
            id_ := or(id_, shl(gasprice(), 64))
            id_ := or(id_, number())
        }
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

        // TODO: remove this
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
        // S().cToken.redeemUnderlying(amount);

        // Transfer funds back to lender
        SafeERC20.safeTransfer(S().underlying, _msgSender(), amount);

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
        S().cToken.accrueInterest();
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
        totalSupply_ =
            S().underlying.balanceOf(address(this)) +
            S().cToken.balanceOfUnderlying(address(this));
    }
}
