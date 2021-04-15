// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { DappData } from "../../storage/market.sol";

interface ILoansEscrow {
    function init(address _operator) external virtual;

    function callDapp(DappData calldata dappData) external virtual;

    function claimTokens() external virtual;

    function executeStrategy() external virtual;
}
