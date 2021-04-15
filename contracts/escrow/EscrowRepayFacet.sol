// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../contexts2/access-control/roles/RolesMods.sol";
import "../contexts2/access-control/reentry/ReentryMods.sol";
import "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Interfaces
import { ILoansEscrow } from "./interfaces/ILoansEscrow.sol";
import {
    IERC20,
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

// Libraries
import { LibDapps } from "../dapps/libraries/LibDapps.sol";
import { LibLoans } from "../market/libraries/LibLoans.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";

contract EscrowRepayFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice Repay this Escrow's loan.
     * @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
     * @dev Only the owner of the Escrow can call this. If someone else wants to make a payment, they should call the loan manager directly.
     */
    function repay(uint256 amount)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry("")
    {
        IERC20 token = IERC20(lendingToken);
        uint256 balance = LibDapps.balanceOf(address(token));
        uint256 totalOwed = LibLoans.getTotalOwed(loanID);
        if (balance < totalOwed && amount > balance) {
            uint256 amountNeeded =
                amount > totalOwed
                    ? totalOwed.sub(balance)
                    : amount.sub(balance);

            token.safeTransferFrom(msg.sender, address(this), amountNeeded);
        }
        token.safeApprove(lendingPool, amount);

        LendingLib.repay(amount, loanID);
    }
}
