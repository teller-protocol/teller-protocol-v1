// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface ILoansEscrow {
    function init() external;

    function callDapp(address dappAddress, bytes calldata dappData)
        external
        returns (bytes memory);

    function setTokenAllowance(address token, address spender) external;

    function claimToken(
        address token,
        address to,
        uint256 amount
    ) external;
}
