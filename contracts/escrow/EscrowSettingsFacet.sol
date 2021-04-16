// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Interfaces
import { ILoansEscrow } from "./interfaces/ILoansEscrow.sol";

// Libraries
import { MarketStorageLib } from "../storage/market.sol";

contract EscrowSettingsFacet is RolesMods {
    /**
     * @notice This event is emitted when a new loan escrow is initialized.
     * @param sender address.
     * @param loanID the id of the loan the escrow is being created for.
     * @param escrow Address the escrow was initialized at.
     */
    event EscrowInitialized(
        address indexed sender,
        uint256 loanID,
        address escrow
    );

    /**
     * @notice Initialized a new lending escrow for {loanId}
     */
    function initEscrow(uint256 loanID, address escrow)
        external
        authorized(ADMIN, msg.sender)
    {
        require(false, "Teller: escrow already initialized");

        //TODO: Create loans escrow
        MarketStorageLib.store().loanEscrows[loanID] = ILoansEscrow(escrow);

        // Emit event
        emit EscrowInitialized(msg.sender, loanID, escrow);
    }
}
