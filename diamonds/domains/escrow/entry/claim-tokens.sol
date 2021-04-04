// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../data/escrow.sol";
import "../storage/escrow.sol";
import {
    mod_onlyOwner_AccessControl
} from "../../../contexts/access-control/modifiers/only-owner.sol";
import { int_getLendingToken_Escrow } from "../internal/get-lending-token.sol";

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

abstract contract ent_claimToken_Escrow is ent_claimTokens_Escrow_v1 {}

abstract contract ent_claimTokens_Escrow_v1 is
    dat_Escrow,
    sto_Escrow,
    mod_onlyOwner_AccessControl,
    int_getLendingToken_Escrow
{
    /**
     * @notice Sends the tokens owned by this escrow to the owner.
     * @dev The loan must not be active.
     * @dev The recipient must be the loan borrower AND the loan must be already liquidated.
     */
    function claimTokens() external onlyOwner {
        require(
            escrowStore().market.status(loanID) ==
                TellerCommon.LoanStatus.Closed,
            "LOAN_NOT_CLOSED"
        );

        address[] memory tokens = getTokens();
        for (uint256 i = 0; i < tokens.length; i++) {
            uint256 balance = _balanceOf(tokens[i]);
            if (balance > 0) {
                IERC20(tokens[i]).safeTransfer(msg.sender, balance);
            }
        }

        emit TokensClaimed(msg.sender);
    }
}
