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
    /**
     * @notice The token that is the underlying assets for this Teller token.
     */
    function underlying() external view virtual returns (ERC20);

    /**
     * @notice Increase account supply of specified token amount.
     * @param account The account to mint tokens to.
     * @param amount The amount of tokens to mint.
     */
    function mint(address account, uint256 amount) external virtual;

    /**
     * @notice Reduce account supply of specified token amount.
     * @param account The account to burn tokens from.
     * @param amount The amount of tokens to burn.
     */
    function burn(address account, uint256 amount) external virtual;

    /**
     * @param _diamond The TellerDiamond address used as the owner.
     * @param _underlying The token address represented by this TToken.
     */
    function initialize(address _diamond, address _underlying) external virtual;
}
