// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import { LibCreateLoan } from "./libraries/LibCreateLoan.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { LibConsensus } from "./libraries/LibConsensus.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import {
    LoanRequest,
    LoanStatus,
    Loan,
    MarketStorageLib
} from "../storage/market.sol";

contract CreateLoanConsensusFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     *
     * @param request Struct of the protocol loan request
     * @param collateralToken Token address to use as collateral for the new loan
     * @param collateralAmount Amount of collateral required for the loan
     */
    function takeOutLoan(
        LoanRequest calldata request,
        address collateralToken,
        uint256 collateralAmount
    ) external payable paused(LibLoans.ID, false) nonReentry("") {
        // Perform loan request checks
        require(
            msg.sender == request.request.borrower,
            "Teller: not loan requester"
        );
        require(
            collateralToken != address(0) &&
                EnumerableSet.contains(
                    MarketStorageLib.store().collateralTokens[
                        request.request.assetAddress
                    ],
                    collateralToken
                ),
            "Teller: collateral token not allowed"
        );

        // Get consensus values from request
        (
            uint16 interestRate,
            uint16 collateralRatio,
            uint256 maxLoanAmount
        ) = LibConsensus.processLoanTerms(request);

        require(
            maxLoanAmount <= request.request.amount,
            "Teller: asset max loan amount exceeded"
        );

        Loan storage loan = LibCreateLoan.initNewLoan(
            request.request.assetAddress,
            maxLoanAmount,
            request.request.duration,
            interestRate
        );
        // Save collateral token to loan
        loan.collateralToken = collateralToken;
        // Set the collateral ratio to loans
        loan.collateralRatio = collateralRatio;

        // Pay in collateral
        if (collateralAmount > 0) {
            LibCollateral.deposit(loan.id, collateralToken, collateralAmount);
        }

        // Check that enough collateral has been provided for this loan
        require(
            LibLoans.getCollateralNeeded(loan.id) <=
                LibCollateral.e(loan.id).loanSupply(loan.id),
            "Teller: more collateral required"
        );

        address borrower = LibLoans.canGoToEOAWithCollateralRatio(
            loan.collateralRatio
        )
            ? loan.borrower
            : LibCreateLoan.createEscrow(loan.id);

        LibCreateLoan.fundLoan(
            loan.lendingToken,
            borrower,
            loan.borrowedAmount
        );

        // Set the loan to active
        loan.status = LoanStatus.Active;

        emit LibCreateLoan.LoanTakenOut(
            loan.id,
            msg.sender,
            loan.borrowedAmount,
            false
        );
    }
}
