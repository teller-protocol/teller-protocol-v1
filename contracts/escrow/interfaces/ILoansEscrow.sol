// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;
import { DappData } from "../../storage/market.sol";

interface ILoansEscrow {
    function init(address _operator) external virtual;

    function callDapp(address dappAddress, bytes calldata dappData)
        external
        virtual;

    function claimTokens(uint256 loanID) external;

    function claimTokensByCollateralValue(
        uint256 loanID,
        address recipient,
        uint256 value
    ) external;

    function calculateTotalValue(uint256 loanID)
        external
        view
        returns (uint256);
}
