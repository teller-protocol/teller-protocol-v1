// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { LoansMods } from "./LoansMods.sol";
import { PausableMods } from "../contexts2/pausable/PausableMods.sol";
import { RolesLib } from "../contexts2/access-control/roles/RolesMods.sol";
import { AUTHORIZED } from "../shared/roles.sol";

// Libraries
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { LibConsensus } from "./libraries/LibConsensus.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/PlatformSettingsLib.sol";
import { MaxDebtRatioLib } from "../settings/asset/MaxDebtRatioLib.sol";

// Storage
import {
    LoanRequest,
    LoanResponse,
    LoanStatus,
    LoanTerms,
    MarketStorageLib
} from "../storage/market.sol";

contract CreateLoanFacet is RolesMods, PausableMods, LoansMods {
    /**
        @notice This event is emitted when loan terms have been successfully set
        @param loanID ID of loan from which collateral was withdrawn
        @param borrower Account address of the borrower
        @param recipient Account address of the recipient
     */
    event LoanTermsSet(
        uint256 indexed loanID,
        address indexed borrower,
        address indexed recipient
    );

    /**
        @notice This event is emitted when a loan has been successfully taken out
        @param loanID ID of loan from which collateral was withdrawn
        @param borrower Account address of the borrower
        @param amountBorrowed Total amount taken out in the loan
     */
    event LoanTakenOut(
        uint256 indexed loanID,
        address indexed borrower,
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
    ) external payable paused("", false) authorized(AUTHORIZED, msg.sender) {
        // Perform loan request checks
        CreateLoanLib.validateRequest(request);

        // Get and increment new loan ID
        uint256 loanID = CreateLoanLib.newID();
        Loan storage loan = MarketStorageLib.marketStore().loans[loanID];
        MarketStorageLib.marketStore().borrowerLoans[request.borrower].push(
            loanID
        );

        require(
            loan.status == LoanStatus.NonExistent,
            "Teller: loan already exists"
        );

        // Get consensus values from request
        (uint256 interestRate, uint256 collateralRatio, uint256 maxLoanAmount) =
            LibConsensus.processLoanTerms(request, responses);

        // TODO: need to store on struct?
        loan.id = loanID;
        loan.status = LoanStatus.TermsSet;
        loan.loanTerms = LoanTerms({
            borrower: request.borrower,
            recipient: request.recipient,
            interestRate: interestRate,
            collateralRatio: collateralRatio,
            maxLoanAmount: maxLoanAmount,
            duration: request.duration
        });

        loan.termsExpiry =
            block.timestamp +
            PlatformSettingsLib.getTermsExpiryTimeValue();

        if (collateralAmount > 0) {
            LibCollateral._payInCollateral(loanID, collateralAmount);
        }

        emit LoanTermsSet(loanID, msg.sender, request.recipient);
    }

    /**
     * @notice Take out a loan
     *
     * @dev collateral ratio is a percentage of the loan amount that's required in collateral
     * @dev the percentage will be *(10**2). I.e. collateralRatio of 5244 means 52.44% collateral
     * @dev is required in the loan. Interest rate is also a percentage with 2 decimal points.
     */
    function takeOutLoan(uint256 loanID, uint256 amount)
        external
        paused("", false)
        authorized(AUTHORIZED, msg.sender)
    {
        Loan storage loan = MarketStorageLib.marketStore().loans[loanID];
        CreateLoanLib.verifyTakeOut(loan);

        loan.borrowedAmount = amount;
        loan.principalOwed = amount;
        loan.interestOwed = LibLoans.getInterestOwedFor(loanID, amount);
        loan.status = LoanStatus.Active;
        loan.loanStartTime = block.timestamp;

        address loanRecipient;
        bool eoaAllowed = LibLoans.canGoToEOA(loanID);
        if (eoaAllowed) {
            loanRecipient = loan.loanTerms.recipient == address(0)
                ? loan.loanTerms.borrower
                : loan.loanTerms.recipient;
        } else {
            // TODO: escrows
            address escrow = _createEscrow(loanID);
            loanRecipient = escrow;
        }

        // Transfer tokens to the borrower.
        // TODO: pull funds from lending escrow
        // TODO: transfer tokens to borrower
        // TODO: update lending total borrowed amount

        if (!eoaAllowed) {
            // TODO: Implement once escrow facet is complete
            //            IEscrow(MarketStorageLib.marketStore().loans[loanID].escrow).initialize(
            //                address(IPlatformSettings(PROTOCOL)),
            //                address(ILendingPool(PROTOCOL)),
            //                loanID,
            //                MarketStorageLib.marketStore().lendingToken,
            //                MarketStorageLib.marketStore().loans[loanID].loanTerms.borrower
            //            );
        }

        emit LoanTakenOut(loanID, loan.loanTerms.borrower, amount);
    }
}

library CreateLoanLib {
    function newID() internal view returns (uint256 id_) {
        Counters.Counter storage counter =
            MarketStorageLib.marketStore().loanIDCounter;
        id_ = Counter.current(counter);
        Counter.increment(counter);
    }

    function validateRequest(LoanRequest memory request) internal view {
        require(
            msg.sender == request.loanTerms.borrower,
            "Teller: not loan requester"
        );
        require(
            LendingLib.debtRatioFor(request.assetAddress, request.amount) >
                MaxDebtRatioLib.get(loan.lendingToken),
            "Teller: max supply-to-debt ratio exceeded"
        );
        require(
            MaxLoanAmountLib.get(request.assetAddress) > request.amount,
            "Teller: max loan amount exceeded"
        );
        require(
            PlatformSettingsLib.getMaximumLoanDurationValue() >=
                request.duration,
            "Teller: max loan duration exceeded"
        );

        if (request.recipient != address(0)) {
            require(
                LibLoans.canGoToEOA(loanID),
                "Teller: under collateralized loan with recipient"
            );
        }
    }

    function verifyTakeOut(Loan storage loan) internal view {
        require(msg.sender == loan.loanTerms.borrower, "Teller: not borrower");
        require(loan.status == LoanStatus.TermsSet, "Teller: loan not set");
        require(
            loan.termsExpiry >= block.timestamp,
            "Teller: loan terms expired"
        );
        require(
            LendingLib.debtRatioFor(loan.lendingToken, amountBorrow) >
                MaxDebtRatioLib.get(loan.lendingToken),
            "Teller: max supply-to-debt exceeded"
        );
        require(
            loan.loanTerms.maxLoanAmount >= amountBorrow,
            "Teller: max loan amount exceeded"
        );
        // Check that enough collateral has been provided for this loan
        (, int256 neededInCollateral, ) =
            LibLoans.getCollateralNeededInfo(loanID);
        require(
            neededInCollateral <= int256(loan.collateral),
            "Teller: more collateral required"
        );
        require(
            loan.lastCollateralIn <=
                block.timestamp -
                    (PlatformSettingsLib.getSafetyIntervalValue()),
            "Teller: collateral deposited recently"
        );
    }
}
