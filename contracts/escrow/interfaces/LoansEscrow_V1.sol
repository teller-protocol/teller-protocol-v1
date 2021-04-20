// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import { ILoansEscrow } from "./ILoansEscrow.sol";
import { DappData } from "../../storage/market.sol";

contract LoansEscrow_V1 is OwnableUpgradeable, ILoansEscrow {
    function init() external override {
        OwnableUpgradeable.__Ownable_init();
    }

    function callDapp(address dappAddress, bytes calldata dappData)
        external
        override
        onlyOwner
    {}
}
