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
    LoanRequestNFT,
    LoanStatus,
    LoanTerms,
    Loan,
    MarketStorageLib,
    Signature,
    DataProviderSignature
} from "../storage/market.sol";
import { AppStorageLib } from "../storage/app.sol";

contract CreateLoanNFTFacet is RolesMods, ReentryMods, PausableMods {
    /**
     * @notice This event is emitted when a loan has been successfully taken out
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param amountBorrowed Total amount taken out in the loan
     * @param withNFT Boolean indicating if the loan was taken out using NFTs
     */
    event LoanTakenOutNFT(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountBorrowed,
        bool withNFT
    );

    function takeOutLoanNFTs(
        LoanRequestNFT calldata request,
        uint16[] calldata nftIDs
    ) external paused(LibLoans.ID, false) {
        // create loan from library
        Loan storage loan = CreateLoanNFTLib.createLoanNFT(request);

        // Create loan
        uint256 loanID = CreateLoanNFTLib.currentID() - 1;
        uint256 amount = LibLoans.loan(loanID).borrowedAmount;
        uint8 lendingDecimals = ERC20(request.assetAddress).decimals();
        uint256 allowedBaseLoanSize;
        for (uint256 i; i < nftIDs.length; i++) {
            NFTLib.applyToLoan(loanID, nftIDs[i]);

            allowedBaseLoanSize += NFTLib.s().nftDictionary.tokenBaseLoanSize(
                nftIDs[i]
            );
        }
        require(
            amount <= allowedBaseLoanSize * (10**lendingDecimals),
            "Teller: insufficient NFT loan size"
        );

        // Pull funds from Teller Token LP and transfer to the new loan escrow
        LendingLib.tToken(LibLoans.loan(loanID).lendingToken).fundLoan(
            CreateLoanNFTLib.createEscrow(loanID),
            amount
        );

        emit LoanTakenOutNFT(
            loanID,
            msg.sender,
            LibLoans.loan(loanID).borrowedAmount,
            true
        );

        // set to active
        loan.status = LoanStatus.Active;
        loan.loanStartTime = uint32(block.timestamp);
        loan.duration = request.duration;
    }
}

library CreateLoanNFTLib {
    function createLoanNFT(LoanRequestNFT calldata request)
        internal
        returns (Loan storage loan)
    {
        // Perform loan request checks
        require(
            PlatformSettingsLib.getMaximumLoanDurationValue() >=
                request.duration,
            "Teller: max loan duration exceeded"
        );

        // tier 3 example
        uint256 maxLoanAmount = 25000;

        // Perform loan value checks
        require(
            MaxLoanAmountLib.get(request.assetAddress) > maxLoanAmount,
            "Teller: asset max loan amount exceeded"
        );
        require(
            LendingLib.tToken(request.assetAddress).debtRatioFor(
                maxLoanAmount
            ) <= MaxDebtRatioLib.get(request.assetAddress),
            "Teller: max supply-to-debt ratio exceeded"
        );

        // Get and increment new loan ID
        uint256 loanID = CreateLoanNFTLib.newID();

        // Set loan data based on terms
        loan = LibLoans.loan(loanID);
        loan.id = uint128(loanID);
        loan.status = LoanStatus.TermsSet;
        loan.lendingToken = request.assetAddress;
        loan.borrower = request.borrower;
        loan.borrowedAmount = maxLoanAmount;

        // since we are creating a loan with nft, we get the nft interest rate from
        // our platform settings
        loan.interestRate = PlatformSettingsLib.getNFTInterestRate();

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
