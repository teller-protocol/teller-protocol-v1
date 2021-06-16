// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../settings/pausable/PausableMods.sol";

// Interfaces
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { MarketStorageLib, LoanStatus } from "../storage/market.sol";

// Libraries
import { LibLoans } from "../market/libraries/LibLoans.sol";
import { LibEscrow } from "./libraries/LibEscrow.sol";

/**
 * @notice Contains functionality to claim tokens that are in an escrow contract for a loan.
 */
contract EscrowClaimTokens is PausableMods {
    /**
     * @notice Notifies when the Escrow's tokens have been claimed.
     * @param recipient address where the tokens where sent to.
     */
    event TokensClaimed(address recipient);

    /**
     * @notice Sends the tokens owned by this escrow to the owner.
     * @param loanID The id of the loan being used.
     */
    function claimTokens(uint256 loanID) external paused("", false) {
        require(
            LibLoans.loan(loanID).borrower == msg.sender,
            "Teller: claim not borrower"
        );
        require(
            LibLoans.loan(loanID).status == LoanStatus.Closed,
            "Teller: loan not closed"
        );

        __claimEscrowTokens(loanID);
    }

    function __claimEscrowTokens(uint256 loanID) internal {
        __claimToken(loanID, LibLoans.loan(loanID).lendingToken);

        EnumerableSet.AddressSet storage tokens =
            MarketStorageLib.store().escrowTokens[loanID];
        for (uint256 i = 0; i < EnumerableSet.length(tokens); i++) {
            __claimToken(loanID, EnumerableSet.at(tokens, i));
        }

        emit TokensClaimed(msg.sender);
    }

    function __claimToken(uint256 loanID, address token) private {
        uint256 balance = LibEscrow.balanceOf(loanID, token);
        if (balance > 0) {
            LibEscrow.e(loanID).claimToken(
                token,
                LibLoans.loan(loanID).borrower,
                balance
            );
        }
    }
}
