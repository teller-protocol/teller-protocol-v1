// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import {
    OwnableUpgradeable
} from "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import {
    ERC20Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
 * @notice This contract acts as an interface for the Teller token (TToken).
 *
 * @author develop@teller.finance
 */
abstract contract ITToken is OwnableUpgradeable, ERC20Upgradeable {
    struct InitArgs {
        address controller;
        address underlying;
        address cToken;
        uint256 maxTVL;
    }

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

    /**
     * @notice Increase account supply of specified token amount.
     * @param amount The amount of tokens to mint.
     */
    function mint(uint256 amount) external virtual;

    /**
     * @notice Increase account supply of specified token amount
     * @param account The account to mint tokens to
     * @param amount The amount of tokens to mint
     *
     * Restrictions:
     *  - Caller must be the owner
     */
    function mintOnBehalf(address account, uint256 amount) external virtual;

    /**
     * @notice Redeem supplied Teller token underlying value.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeem(uint256 amount) external virtual;

    /**
     * @notice Redeem supplied Teller token value.
     * @param account The account to redeem tokens for.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeemOnBehalf(address account, uint256 amount) external virtual;

    /**
     * @notice Redeem supplied underlying value.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount) external virtual;

    /**
     * @notice Redeem supplied underlying value.
     * @param account The account to redeem tokens for.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlyingOnBehalf(address account, uint256 amount)
        external
        virtual;

    function totalUnderlyingSupply()
        external
        virtual
        returns (uint256 totalSupply_);

    /**
     * @notice Initializes the Teller token
     */
    function initialize(InitArgs calldata args) external virtual;
}
