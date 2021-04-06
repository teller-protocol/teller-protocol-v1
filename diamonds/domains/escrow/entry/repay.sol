// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import "../storage/escrow.sol";
import {
    mod_onlyOwner_AccessControl
} from "../../../contexts/access-control/modifiers/only-owner.sol";

// Interfaces
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { int_getLendingToken_Escrow } from "../internal/get-lending-token.sol";

abstract contract ent_CallDapp_v1 is
    sto_Escrow,
    mod_onlyOwner_AccessControl,
    int_getLendingToken_Escrow
{
    /**
     * @notice Repay this Escrow's loan.
     * @dev If the Escrow's balance of the borrowed token is less than the amount to repay, transfer tokens from the sender's wallet.
     * @dev Only the owner of the Escrow can call this. If someone else wants to make a payment, they should call the loan manager directly.
     */
    function repay(uint256 amount) external onlyOwner {
        IERC20 token = IERC20(_getLendingToken());
        uint256 balance = token.balanceOf(address(this));
        uint256 totalOwed =
            escrowStore().market.getTotalOwed(escrowStore().loanID);
        if (balance < totalOwed && amount > balance) {
            uint256 amountNeeded =
                amount > totalOwed
                    ? totalOwed.sub(balance)
                    : amount.sub(balance);

            token.safeTransferFrom(msg.sender, address(this), amountNeeded);
        }
        token.safeApprove(address(escrowStore().market), amount);

        escrowStore().market.repay(amount, escrowStore().loanID);
    }
}

abstract contract ent_CallDapp is ent_CallDapp_v1 {}
