// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Storage
import { AppStorageLib } from "../storage/app.sol";
import {
    LoanRequest,
    LoanResponse,
    LoanStatus,
    LoanTerms,
    MarketStorageLib,
    LendingPool
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
import {
    SafeERC20
} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { LibLendingPool } from "../lending/libraries/LibLendingPool.sol";

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
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     */
    function takeOutLoan(uint256 loanID, uint256 amountBorrow)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        require(
            msg.sender ==
                MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            "NOT_BORROWER"
        );
        require(
            MarketStorageLib.marketStore().loans[loanID].status ==
                LoanStatus.TermsSet,
            "LOAN_NOT_SET"
        );
        require(
            MarketStorageLib.marketStore().loans[loanID].termsExpiry >=
                block.timestamp,
            "LOAN_TERMS_EXPIRED"
        );

        address lendingTokenAddress =
            MarketStorageLib.marketStore().loans[loanID].lendingToken;
        LendingPool storage lendingPool =
            MarketStorageLib.marketStore().lendingPool[lendingTokenAddress];

        require(
            LibLendingPool.isDebtRatioValid(lendingTokenAddress, amountBorrow),
            "SUPPLY_TO_DEBT_EXCEEDS_MAX"
        );
        require(
            MarketStorageLib.marketStore().loans[loanID]
                .loanTerms
                .maxLoanAmount >= amountBorrow,
            "MAX_LOAN_EXCEEDED"
        );
        // check that enough collateral has been provided for this loan
        (, int256 neededInCollateral, ) =
            LibLoans.getCollateralNeededInfo(loanID);
        require(
            neededInCollateral <=
                int256(MarketStorageLib.marketStore().loans[loanID].collateral),
            "MORE_COLLATERAL_REQUIRED"
        );
        require(
            MarketStorageLib.marketStore().loans[loanID].lastCollateralIn <=
                block.timestamp -
                    (PlatformSettingsLib.getSafetyIntervalValue()),
            "COLLATERAL_DEPOSITED_RECENTLY"
        );

        MarketStorageLib.marketStore().loans[loanID]
            .borrowedAmount = amountBorrow;
        MarketStorageLib.marketStore().loans[loanID]
            .principalOwed = amountBorrow;
        MarketStorageLib.marketStore().loans[loanID].interestOwed = LibLoans
            .getInterestOwedFor(loanID, amountBorrow);
        MarketStorageLib.marketStore().loans[loanID].status = LoanStatus.Active;
        MarketStorageLib.marketStore().loans[loanID].loanStartTime = block
            .timestamp;

        address loanRecipient;
        bool eoaAllowed = LibLoans.canGoToEOA(loanID);
        if (eoaAllowed) {
            loanRecipient = MarketStorageLib.marketStore().loans[loanID]
                .loanTerms
                .recipient
                .isEmpty()
                ? MarketStorageLib.marketStore().loans[loanID]
                    .loanTerms
                    .borrower
                : MarketStorageLib.marketStore().loans[loanID]
                    .loanTerms
                    .recipient;
        } else {
            // TODO: Implement once escrow facet is complete
            //            MarketStorageLib.marketStore().loans[loanID].escrow = _createEscrow(loanID);
            //            MarketStorageLib.marketStore().loans[loanID].loanTerms.recipient = MarketStorageLib.marketStore().loans[loanID].escrow;
        }

        uint256 lendingTokenBalance =
            lendingPool.lendingToken.balanceOf(address(this));
        if (lendingTokenBalance < amountBorrow) {
            LibLendingPool.withdrawFromCompoundIfSupported(
                lendingTokenAddress,
                amountBorrow - (lendingTokenBalance)
            );
        }

        // Transfer tokens to the borrower.
        tokenTransfer(
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            amountBorrow,
            lendingTokenAddress
        );

        lendingPool.totalBorrowed = lendingPool.totalBorrowed + (amountBorrow);

        if (!eoaAllowed) {
            require(
                MarketStorageLib.marketStore().loans[loanID].escrow !=
                    address(0),
                "ESCROW_CONTRACT_NOT_DEFINED"
            );
            // TODO: Implement once escrow facet is complete
            //            IEscrow(MarketStorageLib.marketStore().loans[loanID].escrow).initialize(
            //                address(IPlatformSettings(PROTOCOL)),
            //                address(ILendingPool(PROTOCOL)),
            //                loanID,
            //                MarketStorageLib.marketStore().lendingToken,
            //                MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower
            //            );
        }

        emit LoanTakenOut(
            loanID,
            MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower,
            MarketStorageLib.marketStore().loans[loanID].escrow,
            amountBorrow
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

    /**
        @notice It transfers an amount of tokens to a specific address.
        @param recipient address which will receive the tokens.
        @param amount of tokens to transfer.
        @param lendingToken the address of the lending token
        @dev It throws a require error if 'transfer' invocation fails.
     */
    function tokenTransfer(
        address recipient,
        uint256 amount,
        address lendingToken
    ) private {
        uint256 currentBalance = IERC20(lendingToken).balanceOf(address(this));
        require(currentBalance >= amount, "LENDING_TOKEN_NOT_ENOUGH_BALANCE");
        SafeERC20.safeTransfer(IERC20(lendingToken), recipient, amount);
    }
}
