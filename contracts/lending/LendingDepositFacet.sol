// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../contexts2/access-control/roles/RolesMods.sol";
import "../contexts2/access-control/reentry/ReentryMods.sol";
import "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Interfaces
import { ILendingEscrow } from "./escrow/ILendingEscrow.sol";

// Libraries
import { LendingLib } from "./libraries/LendingLib.sol";
import { MaxTVLAmountLib } from "../settings/asset/MaxTVLAmountLib.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract LendingDepositFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice This event is emitted when an user deposits tokens into the pool.
     * @param sender address.
     * @param amount of tokens.
     */
    event LendingPoolDeposit(
        address indexed sender,
        uint256 amount,
        uint256 tTokenAmount
    );

    /**
     * @notice It allows users to deposit tokens into the pool.
     * @dev the user must call ERC20.approve function previously.
     * @dev If the cToken is available (not 0x0), it deposits the lending asset amount into Compound directly.
     * @param asset Token address to deposit into the lending pool.
     * @param amount Amount of {asset} to deposit in the pool.
     */
    function lendingPoolDeposit(address asset, uint256 amount)
        external
        paused(LendingLib.FACET_ID, false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry(LendingLib.FACET_ID)
    {
        // Check the max TVL
        (uint256 previousRate, uint256 previousSupply) =
            LendingLib.exchangeRateSupply(asset);
        require(
            previousSupply + amount <= MaxTVLAmountLib.get(asset),
            "Teller: max tvl reached"
        );

        // Transferring tokens to the lending pool escrow
        SafeERC20.safeTransferFrom(
            IERC20(asset),
            msg.sender,
            address(this),
            amount
        );
        LendingLib.s(asset).escrow.deposit(address(this), amount);

        // Update the store amount of lender supply
        LendingLib.s(asset).lenderTotalSupplied[msg.sender] += amount;

        // Calculate Teller token value to mint
        uint256 tTokenAmount = LendingLib.tTokenValue(amount, previousRate);
        // Mint lender their tokens
        LendingLib.s(asset).tToken.mint(msg.sender, tTokenAmount);

        // Emit event
        emit LendingPoolDeposit(msg.sender, amount, tTokenAmount);
    }
}
