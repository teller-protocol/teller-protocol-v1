// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
    Base interface for TToken fund management.
    Offers standard hooks for transfer of funds between various accounts.
    All functions are meant to be delegatecall'ed from the TToken.
    A special function is offerred to pass through some calldata in a more friendly
    way than using fallback().
    See AStrategy for important 
 */
interface IStrategy {
    function beforeDeposit() external;

    function afterDeposit() external;

    function beforeWithdraw() external;

    function afterWithdraw() external;
}
