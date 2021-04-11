// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib } from "../storage/app.sol";
import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus
} from "../storage/market.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { LoansMods } from "./LoansMods.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { AddressLib } from "../shared/libraries/AddressLib.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";

contract CollateralFacet is RolesMods, PausableMods, LoansMods {
    using AddressLib for address;

    /**
     * @notice This event is emitted when collateral has been withdrawn
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param recipient Account address of the recipient
     * @param amount Value of collateral withdrawn
     */
    event CollateralWithdrawn(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Deposit collateral tokens into a loan.
     * @param borrower The address of the loan borrower.
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount to deposit as collateral.
     */
    function depositCollateral(
        address borrower,
        uint256 loanID,
        uint256 amount
    )
        external
        payable
        loanActiveOrSet(loanID)
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        borrower.requireEqualTo(
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            "BORROWER_LOAN_ID_MISMATCH"
        );
        require(amount > 0, "CANNOT_DEPOSIT_ZERO");

        // Update the loan collateral and total. Transfer tokens to this contract.
        LibCollateral._payInCollateral(loanID, amount);
    }

    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        loanActiveOrSet(loanID)
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        require(
            msg.sender ==
                MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            "CALLER_DOESNT_OWN_LOAN"
        );
        require(amount > 0, "CANNOT_WITHDRAW_ZERO");

        if (
            MarketStorageLib.marketStore().loans[loanID].status ==
            LoanStatus.Active
        ) {
            (, int256 neededInCollateralTokens, ) =
                LibLoans.getCollateralNeededInfo(loanID);
            if (neededInCollateralTokens > 0) {
                uint256 withdrawalAmount =
                    MarketStorageLib.marketStore().loans[loanID].collateral -
                        (uint256(neededInCollateralTokens));
                require(
                    withdrawalAmount >= amount,
                    "COLLATERAL_AMOUNT_TOO_HIGH"
                );
            }
        } else {
            require(
                MarketStorageLib.marketStore().loans[loanID].collateral >=
                    amount,
                "COLLATERAL_AMOUNT_NOT_MATCH"
            );
        }

        _withdrawCollateral(loanID, amount, payable(msg.sender));
    }

    function _withdrawCollateral(
        uint256 loanID,
        uint256 amount,
        address payable recipient
    ) internal {
        LibCollateral._payOutCollateral(loanID, amount, recipient);

        emit CollateralWithdrawn(
            loanID,
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            recipient,
            amount
        );
    }
}
