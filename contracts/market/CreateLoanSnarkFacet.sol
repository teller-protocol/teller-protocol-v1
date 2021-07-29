// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { AUTHORIZED, ADMIN } from "../shared/roles.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import { LibLoans } from "./libraries/LibLoans.sol";
import { LibEscrow } from "../escrow/libraries/LibEscrow.sol";
import { LibCollateral } from "./libraries/LibCollateral.sol";
import { LendingLib } from "../lending/libraries/LendingLib.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/libraries/PlatformSettingsLib.sol";
import {
    MaxDebtRatioLib
} from "../settings/asset/libraries/MaxDebtRatioLib.sol";
import {
    MaxLoanAmountLib
} from "../settings/asset/libraries/MaxLoanAmountLib.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";
import { NFTLib } from "../nft/libraries/NFTLib.sol";
import { Verifier } from "./cra/verifier.sol";
import { ECDSA } from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import { ProcessRequestLib } from "./cra/ProcessRequestLib.sol";

// Interfaces
import { ILoansEscrow } from "../escrow/escrow/ILoansEscrow.sol";
import { ITToken } from "../lending/ttoken/ITToken.sol";

// Proxy
import {
    BeaconProxy
} from "@openzeppelin/contracts/proxy/beacon/BeaconProxy.sol";
import { Clones } from "@openzeppelin/contracts/proxy/Clones.sol";

// Storage
import {
    LoanRequestSnark,
    LoanStatus,
    LoanTerms,
    Loan,
    MarketStorageLib,
    Signature,
    DataProviderSignature
} from "../storage/market.sol";
import { AppStorageLib } from "../storage/app.sol";

contract CreateLoanSnarkFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice This event is emitted when a loan has been successfully taken out
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param amountBorrowed Total amount taken out in the loan
     * @param withNFT Boolean indicating if the loan was taken out using NFTs
     */
    event LoanTakenOutSnark(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountBorrowed,
        bool withNFT
    );

    function takeOutLoanSnark(
        LoanRequestSnark calldata request,
        address collateralToken,
        uint256 collateralAmount
    )
        external
        payable
        paused(LibLoans.ID, false)
        nonReentry("")
        authorized(AUTHORIZED, msg.sender)
    {
        // create loan from library
        Loan storage loan = CreateLoanSnarkLib.createLoanSnark(request);
        // Check if collateral token is zero
        require(
            collateralToken != address(0x0),
            "Teller: token addr can't be 0"
        );

        // Verify collateral token is acceptable
        require(
            EnumerableSet.contains(
                MarketStorageLib.store().collateralTokens[
                    request.request.assetAddress
                ],
                collateralToken
            ),
            "Teller: collateral token not allowed"
        );

        // Save collateral token to loan
        loan.collateralToken = collateralToken;

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
        // Pull funds from Teller token LP and and transfer to the recipient
        ITToken tToken = LendingLib.tToken(request.request.assetAddress);

        tToken.fundLoan(
            LibLoans.canGoToEOAWithCollateralRatio(loan.collateralRatio)
                ? loan.borrower
                : CreateLoanSnarkLib.createEscrow(loan.id),
            loan.borrowedAmount
        );

        emit LoanTakenOutSnark(loan.id, msg.sender, loan.borrowedAmount, false);
        // set to active
        loan.status = LoanStatus.Active;
        loan.loanStartTime = uint32(block.timestamp);
        loan.duration = request.request.duration;
    }
}

library CreateLoanSnarkLib {
    function createLoanSnark(LoanRequestSnark calldata request)
        internal
        returns (Loan storage loan)
    {
        // Perform loan request checks
        require(
            PlatformSettingsLib.getMaximumLoanDurationValue() >=
                request.request.duration,
            "Teller: max loan duration exceeded"
        );

        // Get market values
        (
            uint16 interestRate,
            uint16 collateralRatio,
            uint256 maxLoanAmount
        ) = ProcessRequestLib.processMarketRequest(request);

        // Perform loan value checks
        require(
            MaxLoanAmountLib.get(request.request.assetAddress) > maxLoanAmount,
            "Teller: asset max loan amount exceeded"
        );
        require(
            LendingLib.tToken(request.request.assetAddress).debtRatioFor(
                maxLoanAmount
            ) <= MaxDebtRatioLib.get(request.request.assetAddress),
            "Teller: max supply-to-debt ratio exceeded"
        );

        // Get and increment new loan ID
        uint256 loanID = CreateLoanSnarkLib.newID();

        // Set loan data based on terms
        loan = LibLoans.loan(loanID);
        loan.id = uint128(loanID);
        loan.status = LoanStatus.TermsSet;
        loan.lendingToken = request.request.assetAddress;
        loan.borrower = request.request.borrower;
        loan.borrowedAmount = maxLoanAmount;
        loan.interestRate = interestRate;
        loan.collateralRatio = collateralRatio;

        // Set loan debt
        LibLoans.debt(loanID).principalOwed = maxLoanAmount;
        LibLoans.debt(loanID).interestOwed = LibLoans.getInterestOwedFor(
            uint256(loanID),
            maxLoanAmount
        );

        // Add loanID to borrower list
        MarketStorageLib.store().borrowerLoans[loan.borrower].push(
            uint128(loanID)
        );
    }

    /**
     * @notice increments the loanIDCounter
     * @return id_ the new ID requested, which stores it in the loan data
     */
    function newID() internal returns (uint256 id_) {
        Counters.Counter storage counter = MarketStorageLib
            .store()
            .loanIDCounter;
        id_ = Counters.current(counter);
        Counters.increment(counter);
    }

    function currentID() internal view returns (uint256 id_) {
        Counters.Counter storage counter = MarketStorageLib
            .store()
            .loanIDCounter;
        id_ = Counters.current(counter);
    }

    function createEscrow(uint256 loanID) internal returns (address escrow_) {
        // Create escrow
        escrow_ = AppStorageLib.store().loansEscrowBeacon.cloneProxy("");
        ILoansEscrow(escrow_).init();
        // Save escrow address for loan
        MarketStorageLib.store().loanEscrows[loanID] = ILoansEscrow(escrow_);
    }
}
