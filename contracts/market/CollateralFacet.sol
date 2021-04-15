// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { LoansMods } from "./LoansMods.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { ADMIN, AUTHORIZED } from "../shared/roles.sol";

// Libraries
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { AppStorageLib } from "../storage/app.sol";
import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus
} from "../storage/market.sol";

contract CollateralFacet is RolesMods, PausableMods, LoansMods {
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
        // TODO: necessary check?
        require(
            borrower ==
                MarketStorageLib.store().loans[loanID].loanTerms.borrower,
            "Teller: borrower mismatch"
        );

        // Update the loan collateral and total. Transfer tokens to this contract.
        LibCollateral.depositCollateral(loanID, amount);
    }

    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        loanActiveOrSet(loanID)
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        Loan storage loan = MarketStorageLib.store().loans[loanID];

        require(msg.sender == loan.loanTerms.borrower, "Teller: not borrower");
        require(amount > 0, "Teller: zero withdraw");

        if (loan.status == LoanStatus.Active) {
            (, int256 neededInCollateralTokens, ) =
                LibLoans.getCollateralNeededInfo(loanID);
            if (neededInCollateralTokens > 0) {
                uint256 withdrawalAmount =
                    loan.collateral - (uint256(neededInCollateralTokens));
                require(
                    withdrawalAmount >= amount,
                    "COLLATERAL_AMOUNT_TOO_HIGH"
                );
            }
        } else {
            require(
                loan.collateral >= amount,
                "Teller: withdraw greater than collateral"
            );
        }

        LibCollateral.withdrawCollateral(loanID, amount, payable(msg.sender));
    }

    /**
     * @notice Adds tokens allowed to be used as collateral for {asset} loans.
     * @param asset Token address to add allowed collateral tokens.
     * @param collateralTokens List of allowed collateral token addresses.
     *
     * Requirements:
     *  - Sender must be admin
     */
    function addCollateralTokens(
        address asset,
        address[] calldata collateralTokens
    ) external authorized(ADMIN, msg.sender) {
        for (uint256 i; i < collateralTokens; i++) {
            MarketStorageLib.store().collateralTokens[asset].add(
                collateralTokens[i]
            );
        }
    }
}
