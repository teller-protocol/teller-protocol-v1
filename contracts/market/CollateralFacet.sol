// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import { ADMIN, AUTHORIZED } from "../shared/roles.sol";

// Libraries
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import {
    MarketStorageLib,
    MarketStorage,
    LoanStatus,
    Loan
} from "../storage/market.sol";

contract CollateralFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice Deposit collateral tokens into a loan.
     * @param loanID The ID of the loan the collateral is for
     * @param amount The amount to deposit as collateral.
     */
    function depositCollateral(uint256 loanID, uint256 amount)
        external
        payable
        paused("", false)
        nonReentry("")
        authorized(AUTHORIZED, msg.sender)
    {
        uint256 status = uint256(LibLoans.loan(loanID).status);
        require(
            status ==
                (uint256(LoanStatus.TermsSet) ^ uint256(LoanStatus.Active)) &
                    status,
            "Teller: loan not active or set"
        );

        // Transfer tokens to the collateral escrow
        LibCollateral.deposit(loanID, amount);
    }

    /**
     * @notice it withdraws collateral tokens from a loan
     * @param amount to wtihdraw from the loan
     * @param loanID identifier of our loan
     */
    function withdrawCollateral(uint256 amount, uint256 loanID)
        external
        paused("", false)
        nonReentry("")
        authorized(AUTHORIZED, msg.sender)
    {
        // check if caller is borrower
        require(
            msg.sender == LibLoans.loan(loanID).borrower,
            "Teller: not borrower"
        );

        // check if amount required to withdraw is more than zero
        require(amount > 0, "Teller: zero withdraw");

        // here, we check if the loan supply minus the needed collateral tokens is still
        // greater than the amount we want to withdraw
        if (LibLoans.loan(loanID).status == LoanStatus.Active) {
            (, uint256 needed, ) = LibLoans.getCollateralNeededInfo(loanID);
            if (needed > 0) {
                require(
                    LibCollateral.e(loanID).loanSupply(loanID) - needed >=
                        amount,
                    "Teller: collateral withdraw amount over limit"
                );
            }
        }

        // Withdraw collateral and send to loan borrower
        LibCollateral.withdraw(loanID, amount, LibLoans.loan(loanID).borrower);
    }

    /**
     * @notice Adds tokens allowed to be used as collateral for {asset} loans.
     * @notice it creates an escrow for each collateral token address
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
        for (uint256 i; i < collateralTokens.length; i++) {
            EnumerableSet.add(
                MarketStorageLib.store().collateralTokens[asset],
                collateralTokens[i]
            );
            LibCollateral.createEscrow(collateralTokens[i]);
        }
    }

    /**
     * @notice get list of collateral tokens that is allowed to be used on an {asset} loan
     * @param asset token address to get allowed collateral tokens
     * @return tokens_ collateral tokens that are accepted
     */
    function getCollateralTokens(address asset)
        external
        view
        returns (address[] memory tokens_)
    {
        EnumerableSet.AddressSet storage collateralTokens =
            MarketStorageLib.store().collateralTokens[asset];
        tokens_ = new address[](EnumerableSet.length(collateralTokens));
        for (uint256 i; i < EnumerableSet.length(collateralTokens); i++) {
            tokens_[i] = EnumerableSet.at(collateralTokens, i);
        }
    }

    /**
     * @notice get the total collateral tokens in a respective loan
     * @param loanID the identifier of the respective loan
     * @return supply_ the total amount of supply in collateral of the loan
     */
    function getLoanCollateral(uint256 loanID)
        external
        view
        returns (uint256 supply_)
    {
        supply_ = LibCollateral.e(loanID).loanSupply(loanID);
    }
}
