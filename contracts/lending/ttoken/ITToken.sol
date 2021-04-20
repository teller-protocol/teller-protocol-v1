// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { InitArgs } from "./data.sol";
import {
    AccessControlUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import {
    ERC20Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice This contract acts as an interface for the Teller token (TToken).
 *
 * @author develop@teller.finance
 */
abstract contract ITToken is AccessControlUpgradeable, ERC20Upgradeable {
    /**
     * @notice This event is emitted when an user deposits tokens into the pool.
     */
    event Mint(
        address indexed sender,
        uint256 tTokenAmount,
        uint256 underlyingAmount
    );

    /**
     * @notice This event is emitted when an user withdraws tokens from the pool.
     */
    event Redeem(
        address indexed sender,
        uint256 tTokenAmount,
        uint256 underlyingAmount
    );

    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() external view virtual returns (ERC20);

    /**
     * @notice The balance of an {account} denoted in underlying value.
     */
    function balanceOfUnderlying(address account)
        public
        virtual
        returns (uint256 balance_);

    function fundLoan(address recipient, uint256 amount) external virtual;

    function depositStrategy() external virtual;

    /**
     * @notice Increase account supply of specified token amount.
     * @param amount The amount of underlying tokens to use to mint.
     */
    function mint(uint256 amount)
        external
        virtual
        returns (uint256 mintAmount_);

    /**
     * @notice Redeem supplied Teller token underlying value.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeem(uint256 amount) external virtual;

    /**
     * @notice Redeem supplied underlying value.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount) external virtual;

    /**
     * @notice Redeem supplied Teller token underlying value.
     * @return totalSupply_ The total value of the underlying token managed by the LP.
     */
    function totalUnderlyingSupply()
        external
        virtual
        returns (uint256 totalSupply_);

    /**
     * @notice Sets the restricted state of the platform.
     */
    function restrict(bool state) external virtual;

    /**
     * @notice Initializes the Teller token
     */
    function initialize(InitArgs calldata args) external virtual;
}
