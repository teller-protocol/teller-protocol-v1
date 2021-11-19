// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Libraries
import { LibLoans } from "../libraries/LibLoans.sol";
import { LendingLib } from "../../lending/libraries/LendingLib.sol";
import { Counters } from "@openzeppelin/contracts/utils/Counters.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/libraries/PlatformSettingsLib.sol";
import {
    MaxDebtRatioLib
} from "../../settings/asset/libraries/MaxDebtRatioLib.sol";
import {
    MaxLoanAmountLib
} from "../../settings/asset/libraries/MaxLoanAmountLib.sol";
import { ILoansEscrow } from "../../escrow/escrow/ILoansEscrow.sol";

// Storage
import {
    LoanUserRequest,
    LoanStatus,
    Loan,
    MarketStorageLib
} from "../../storage/market.sol";
import { AppStorageLib } from "../../storage/app.sol";

library LibCreateLoan {
    /**
     * @notice This event is emitted when a loan has been successfully taken out
     * @param loanID ID of loan from which collateral was withdrawn
     * @param borrower Account address of the borrower
     * @param amountBorrowed Total amount taken out in the loan
     * @param withNFT Boolean indicating if the loan was taken out using NFTs
     */
    event LoanTakenOut(
        uint256 indexed loanID,
        address indexed borrower,
        uint256 amountBorrowed,
        bool withNFT
    );

    function initNewLoan(
        address assetAddress,
        uint256 amount,
        uint32 duration,
        uint16 interestRate
    ) internal returns (Loan storage loan_) {
        require(assetAddress != address(0), "Teller: asset loan asset null");
        // Perform loan request checks
        require(
            PlatformSettingsLib.getMaximumLoanDurationValue() >= duration,
            "Teller: max loan duration exceeded"
        );
        require(
            LendingLib.tToken(assetAddress).debtRatioFor(amount) <=
                MaxDebtRatioLib.get(assetAddress),
            "Teller: max supply-to-debt ratio exceeded"
        );

        // Get and increment new loan ID
        uint256 loanID = newID();
        loan_ = LibLoans.loan(loanID);

        // Set loan data based on terms
        loan_.id = uint128(loanID);
        loan_.borrower = payable(msg.sender);
        loan_.lendingToken = assetAddress;
        loan_.borrowedAmount = amount;
        loan_.interestRate = interestRate;
        loan_.loanStartTime = uint32(block.timestamp);
        loan_.duration = duration;

        // Set loan debt
        LibLoans.debt(loanID).principalOwed = loan_.borrowedAmount;
        LibLoans.debt(loanID).interestOwed = LibLoans.getInterestOwedFor(
            uint256(loanID),
            loan_.borrowedAmount
        );

        // Add loanID to borrower list
        MarketStorageLib.store().borrowerLoans[loan_.borrower].push(
            uint128(loanID)
        );
    }

    function fundLoan(
        address lendingToken,
        address destination,
        uint256 amount
    ) internal {
        // Pull funds from Teller Token LP and transfer to the new loan escrow
        LendingLib.tToken(lendingToken).fundLoan(destination, amount);
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

    /**
     * @notice it creates a new loan escrow contract
     * @param loanID the ID that identifies the loan
     * @return escrow_ the loanEscrow that gets created
     */
    function createEscrow(uint256 loanID) internal returns (address escrow_) {
        // Create escrow
        escrow_ = AppStorageLib.store().loansEscrowBeacon.cloneProxy("");
        ILoansEscrow(escrow_).init();
        // Save escrow address for loan
        MarketStorageLib.store().loanEscrows[loanID] = ILoansEscrow(escrow_);
    }
}
