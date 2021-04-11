// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib } from "../storage/app.sol";
import {
    LoanRequest,
    LoanResponse,
    LoanStatus,
    LoanTerms,
    MarketStorageLib
} from "../storage/market.sol";
import { LoansMods } from "./LoansMods.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";
import "../contexts2/access-control/roles/RolesMods.sol";
import { LibConsensus } from "./libraries/LibConsensus.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/PlatformSettingsLib.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { AddressLib } from "../../diamonds/libraries/AddressLib.sol";

contract CreateLoanFacet is LoansMods, PausableMods, RolesMods {
    using AddressLib for address;

    /**
        @notice This event is emitted when loan terms have been successfully set
        @param loanID ID of loan from which collateral was withdrawn
        @param borrower Account address of the borrower
        @param recipient Account address of the recipient
        @param interestRate Interest rate set in the loan terms
        @param collateralRatio Collateral ratio set in the loan terms
        @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms
     */
    event LoanTermsSet(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
        //        uint256 duration
        //        uint256 termsExpiry
    );

    /**
        @notice This event is emitted when a loan has been successfully taken out
        @param loanID ID of loan from which collateral was withdrawn
        @param borrower Account address of the borrower
        @param escrow Escrow address associated to this loan
        @param amountBorrowed Total amount taken out in the loan
     */
    event LoanTakenOut(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed escrow,
        uint256 amountBorrowed
    );

    /**
     * @notice Creates a loan with the loan request and terms
     * @param request Struct of the protocol loan request
     * @param responses List of structs of the protocol loan responses
     * @param collateralAmount Amount of collateral required for the loan
     */
    function createLoanWithTerms(
        LoanRequest calldata request,
        LoanResponse[] calldata responses,
        uint256 collateralAmount
    )
        external
        payable
        withValidLoanRequest(request)
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        require(msg.sender == request.borrower, "NOT_LOAN_REQUESTER");

        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            LibConsensus.processLoanTerms(request, responses);

        uint256 loanID =
            _createNewLoan(
                request,
                interestRate,
                collateralRatio,
                maxLoanAmount
            );

        if (collateralAmount > 0) {
            LibCollateral._payInCollateral(loanID, collateralAmount);
        }

        if (request.recipient.isNotEmpty()) {
            require(LibLoans.canGoToEOA(loanID), "UNDER_COLL_WITH_RECIPIENT");
        }

        //        MarketStorageLib.marketStore().borrowerLoans[request.borrower].push(loanID);

        emit LoanTermsSet(
            loanID,
            msg.sender,
            request.recipient,
            interestRate,
            collateralRatio,
            maxLoanAmount
            //            request.duration
        );
    }

    /**
     * @notice Creates a loan with the loan request.
     * @param request Loan request as per the struct of the Teller platform.
     * @param interestRate Interest rate set in the loan terms.
     * @param collateralRatio Collateral ratio set in the loan terms.
     * @param maxLoanAmount Maximum loan amount that can be taken out, set in the loan terms.
     */
    function _createNewLoan(
        LoanRequest memory request,
        uint256 interestRate,
        uint256 collateralRatio,
        uint256 maxLoanAmount
    ) internal returns (uint256) {
        // Get and increment new loan ID
        uint256 loanID = MarketStorageLib.marketStore().loanIDCounter;
        MarketStorageLib.marketStore().loanIDCounter =
            MarketStorageLib.marketStore().loanIDCounter +
            1;

        require(
            MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.NonExistent,
            "LOAN_ALREADY_EXISTS"
        );
        require(request.borrower != address(0), "BORROWER_EMPTY");

        MarketStorageLib.marketStore().loans[loanID].id = loanID;
        MarketStorageLib.marketStore().loans[loanID].status = LoanStatus
            .TermsSet;
        MarketStorageLib.marketStore().loans[loanID].loanTerms = LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        MarketStorageLib.marketStore().loans[loanID].termsExpiry =
            block.timestamp +
            PlatformSettingsLib.getTermsExpiryTimeValue();

        return loanID;
    }
}
