// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../shared/roles.sol";

// Interfaces
import { ITToken } from "./ttoken/ITToken.sol";

// Libraries
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Storage
import { LendingLib } from "./LendingLib.sol";

bytes32 constant ID = keccak256("LENDING");

contract LendingFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice This event is emitted when a new lending pool is initialized.
     * @param sender address.
     * @param asset Token address the pool was initialized for.
     */
    event LendingPoolInitialized(address indexed sender, address asset);

    /**
     * @notice This event is emitted when an user deposits tokens into the pool.
     * @param sender address.
     * @param amount of tokens.
     */
    event LendingPoolDeposit(address indexed sender, uint256 amount);
    /**
     * @notice This event is emitted when an user withdraws tokens from the pool.
     * @param sender address that withdrew the tokens.
     * @param amount of tokens.
     */
    event LendingWithdraw(address indexed sender, uint256 amount);

    /**
     * @notice It allows users to deposit tokens into the pool.
     * @dev the user must call ERC20.approve function previously.
     * @dev If the cToken is available (not 0x0), it deposits the lending asset amount into Compound directly.
     * @param asset Token address to deposit into the lending pool.
     * @param amount Amount of {asset} to deposit in the pool.
     */
    function lendingPoolDeposit(address asset, uint256 amount)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry(ID)
    {
        // Transfer tokens from lender
        SafeERC20.safeTransferFrom(
            IERC20(asset),
            msg.sender,
            address(this),
            amount
        );
        // Set allowance for Teller token to pull funds to mint
        LendingLib.tToken(asset).approve(msg.sender, amount);
        // Mint Teller tokens for lender
        LendingLib.tToken(asset).mintOnBehalf(msg.sender, amount);

        emit LendingPoolDeposit(msg.sender, amount);
    }

    /**
     * @notice
     */
    function lendingWithdraw(address asset, uint256 assetAmount)
        external
        nonReentry(ID)
        paused(ID, false)
    {
        // Redeem underlying token for lender
        LendingLib.tToken(asset).redeemUnderlyingOnBehalf(
            msg.sender,
            assetAmount
        );

        emit LendingWithdraw(msg.sender, assetAmount);
    }

    /**
     * @notice
     */
    function lendingWithdrawAll(address asset)
        external
        nonReentry(ID)
        paused(ID, false)
        returns (uint256 assetAmount)
    {
        // Redeem entire Teller token balance for lender
        ITToken tToken = LendingLib.tToken(asset);
        tToken.redeemOnBehalf(msg.sender, tToken.balanceOf(msg.sender));

        emit LendingWithdraw(msg.sender, assetAmount);
    }

    /**
     * @notice Initialized a new lending pool for {asset}
     */
    function initLendingPool(address asset, address tToken)
        external
        authorized(ADMIN, msg.sender)
    {
        require(
            address(LendingLib.tToken(asset)) == address(0),
            "Teller: lending pool already initialized"
        );

        // Set the Teller token to the asset mapping
        LendingLib.s().tTokens[asset] = ITToken(tToken);

        // Emit event
        emit LendingPoolInitialized(msg.sender, asset);
    }
}
