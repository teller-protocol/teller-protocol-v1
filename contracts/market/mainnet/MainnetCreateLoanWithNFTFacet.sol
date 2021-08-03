// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../../contexts2/access-control/reentry/ReentryMods.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import { LibCreateLoan } from "../libraries/LibCreateLoan.sol";
import { LibLoans } from "../libraries/LibLoans.sol";
import {
    PlatformSettingsLib
} from "../../settings/platform/libraries/PlatformSettingsLib.sol";
import { NFTLib } from "../../nft/libraries/NFTLib.sol";

// Interfaces
import { ITToken } from "../../lending/ttoken/ITToken.sol";

// Storage
import {
    LoanUserRequest,
    LoanStatus,
    Loan
} from "../../storage/market.sol";

contract MainnetCreateLoanWithNFTFacet is ReentryMods, PausableMods {
    /**
     * @notice Creates a loan with the loan request and NFTs without any collateral
     * @param assetAddress Asset address to take out a loan
     * @param amount The amount of the {assetAddress} used for the loan
     * @param duration How long the loan should last (in seconds)
     * @param nftIDs IDs of TellerNFTs to use for the loan
     */
    function takeOutLoanWithNFTs(
        address assetAddress,
        uint256 amount,
        uint32 duration,
        uint16[] calldata nftIDs
    ) external paused(LibLoans.ID, false) {
        Loan storage loan = LibCreateLoan.initNewLoan(
            assetAddress,
            amount,
            duration,
            PlatformSettingsLib.getNFTInterestRate()
        );

        // Calculate the max loan size based on NFT V1 values
        uint8 lendingDecimals = ERC20(assetAddress).decimals();
        uint256 allowedBaseLoanSize;
        for (uint256 i; i < nftIDs.length; i++) {
            NFTLib.applyToLoan(loan.id, nftIDs[i]);

            allowedBaseLoanSize += NFTLib.s().nftDictionary.tokenBaseLoanSize(
                nftIDs[i]
            );
        }
        require(
            loan.borrowedAmount <= allowedBaseLoanSize * (10**lendingDecimals),
            "Teller: insufficient NFT loan size"
        );

        // Fund the loan
        LibCreateLoan.fundLoan(
            loan.lendingToken,
            LibCreateLoan.createEscrow(loan.id),
            loan.borrowedAmount
        );

        // Set the loan to active
        loan.status = LoanStatus.Active;

        emit LibCreateLoan.LoanTakenOut(
            loan.id,
            msg.sender,
            loan.borrowedAmount,
            true
        );
    }
}
