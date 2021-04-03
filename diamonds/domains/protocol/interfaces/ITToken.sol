// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Interfaces
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

/**
    @notice This contract acts as an interface for the Teller token (TToken).

    @author develop@teller.finance
 */
abstract contract ITToken {
    /**
     * @notice The LendingPool linked to this Teller Token.
     */
    function lendingPool() external view virtual returns (address);

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
     * @param lendingPoolAddress the address of the lending pool this token is linked to. It is only used to add it as a minter.
     */
    function initialize(address lendingPoolAddress) external virtual;
}
