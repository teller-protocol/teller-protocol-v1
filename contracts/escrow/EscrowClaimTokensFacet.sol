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
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { MarketStorageLib, LoanStatus } from "../storage/market.sol";
import { LibDapps } from "../dapps/libraries/LibDapps.sol";
import { LibLoans } from "../market/libraries/LibLoans.sol";

contract EscrowClaimTokensFacet is RolesMods, ReentryMods, PausableMods {
    using SafeERC20 for IERC20;
    /**
     * @notice Notifies when the Escrow's tokens have been claimed.
     * @param recipient address where the tokens where sent to.
     */
    event TokensClaimed(address recipient);

    /**
     * @notice Sends the tokens owned by this escrow to the owner.
     * @dev The loan must not be active.
     * @dev The recipient must be the loan borrower AND the loan must be already liquidated.
     * @param loanID The id of the loan being used.
     */
    function claimTokens(uint256 loanID)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
        nonReentry("")
    {
        require(
            MarketStorageLib.store().loans[loanID].status == LoanStatus.Closed,
            "LOAN_NOT_CLOSED"
        );

        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loanID];
        for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
            uint256 balance =
                LibDapps.balanceOf(loanID, EnumerableSet.at(tokens, i));
            if (balance > 0) {
                IERC20(EnumerableSet.at(tokens, i)).safeTransfer(
                    msg.sender,
                    balance
                );
            }
        }

        emit TokensClaimed(msg.sender);
    }
}
