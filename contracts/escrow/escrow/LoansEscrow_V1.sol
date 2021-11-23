// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts

// Interfaces
import { ILoansEscrow } from "./ILoansEscrow.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { ICErc20 } from "../../shared/interfaces/ICErc20.sol";

// Libraries
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";

// Proxy
import {
    InitializeableBeaconProxy
} from "../../shared/proxy/beacon/InitializeableBeaconProxy.sol";
import { IBeacon } from "@openzeppelin/contracts/proxy/beacon/IBeacon.sol";

contract LoansEscrow_V1 is ILoansEscrow {
    address public owner;

    modifier onlyOwner() {
        require(owner == msg.sender, "Teller: loan escrow not owner");
        _;
    }

    function init() external override {
        require(owner == address(0), "Teller: loan escrow already initialized");
        owner = msg.sender;
    }

    /**
     * @notice it calls a dapp like YearnFinance at a target contract address with specified calldata
     * @param dappAddress address of the target contract address
     * @param dappData encoded abi of the function in our contract we want to call
     * @return resData_ the called data in
     */
    function callDapp(address dappAddress, bytes calldata dappData)
        external
        payable
        override
        onlyOwner
        returns (bytes memory resData_)
    {
        resData_ = Address.functionCall(
            dappAddress,
            dappData,
            "Teller: dapp call failed"
        );
    }

    /**
     * @notice it calls a dapp like YearnFinance at a target contract address with specified calldata
     * @param dappAddress address of the target contract address
     * @param dappData encoded abi of the function in our contract we want to call
     * @param amount amount to call the dapp with as msg.value
     * @return resData_ the called data in
     */
    function callDappWithValue(
        address dappAddress,
        bytes calldata dappData,
        uint256 amount
    ) external payable override onlyOwner returns (bytes memory resData_) {
        require(
            address(this).balance <= amount,
            "Escrow does not have enough balance"
        );
        resData_ = Address.functionCallWithValue(
            dappAddress,
            dappData,
            amount,
            "Teller: dapp call failed"
        );
    }

    /**
     * @notice it approves the spender to spend a maximum amount of a respective token from a token address
     * @param token address of the respective ERC20 token to approve for the spender
     * @param spender address of the respective spender who is approved by the token contract
     */
    function setTokenAllowance(address token, address spender)
        external
        override
        onlyOwner
    {
        IERC20(token).approve(spender, type(uint256).max);
    }

    /**
     * @notice it allows user to claim their escrow tokens
     * @dev only the owner (TellerDiamond) can make this call on behalf of their users
     * @param token address of the respective token contract to claim tokens from
     * @param to address where the tokens should be transferred to
     * @param amount uint256 amount of tokens to be claimed
     */
    function claimToken(
        address token,
        address to,
        uint256 amount
    ) external override onlyOwner {
        SafeERC20.safeTransfer(IERC20(token), to, amount);
    }
}
