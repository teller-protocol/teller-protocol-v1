// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../Storage.sol" as Storage;
import "./IStrategy.sol";

/**
    Standard interface for TTokens to implement. Inherits from IERC20 for its
    basic non-detailed variant. This interface's functions are u
 */
interface ITToken is IERC20 {
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
     * @notice Get total supply of underlying().
     * @return totalSupply of the underlying token managed by the LP.
     */
    function totalSupplyUnderlying()
        external
        view
        returns (uint256 totalSupply);

    /**
     * @notice The balance of an {account} denoted in underlying value.
     */
    function balanceOfUnderlying(address account)
        external
        view
        returns (uint256 balance_);

    /**
        @notice Retrieve the current strategy for this TToken.
     */
    function strategy() external view returns (IStrategy strategy_);

    /**
     * @notice Get the exchange rate based on the current totalSupply and
     * totalSupplyUnderlying values.
     */
    function exchangeRate() external view returns (uint256 exchangeRate_);

    /**
        @notice Interact directly  with the strategy if it supports the encoded
        data.
        @dev Note that strategies must return a magic salt value when we
        delegatecall into them to prevent bad state scenarios.
        @param input The call data passed to the strategy. 
     */
    function strategize(bytes calldata input)
        external
        returns (bytes memory output);

    /**
     * @notice Send underlying token to a loan.
     * @param recipient of the transfer.
     * @param amount to transfer.
     */
    function fundLoan(address recipient, uint256 amount) external;

    /**
     * @notice Increase account supply of specified token amount.
     * @param amount The amount of underlying tokens to use to mint.
     */
    function mint(uint256 amount) external returns (uint256 mintAmount_);

    /**
     * @notice Burn {amount} tTokens in exchange for underlying tokens at the
     * current exchange rate.
     * @param amount The amount of Teller tokens to redeem.
     */
    function redeem(uint256 amount) external;

    /**
     * @notice Redeem {amount} underlying tokens, burning however many tTokens
     * as necessary.
     * @param amount The amount of underlying tokens to redeem.
     */
    function redeemUnderlying(uint256 amount) external;
}
