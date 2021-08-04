// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { ERC20 } from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Libraries
import { LibCreateLoan } from "./libraries/LibCreateLoan.sol";
import { LibLoans } from "./libraries/LibLoans.sol";
import {
    PlatformSettingsLib
} from "../settings/platform/libraries/PlatformSettingsLib.sol";
import { NFTLib } from "../nft/libraries/NFTLib.sol";

import { TellerNFT_V2 } from "../nft/TellerNFT_V2.sol";

// Interfaces
import { ITToken } from "../lending/ttoken/ITToken.sol";

// Storage
import { LoanUserRequest, LoanStatus, Loan } from "../storage/market.sol";

contract CreateLoanWithNFTFacet is ReentryMods, PausableMods {
    // TELLER NFT V2
    TellerNFT_V2 private immutable TELLER_NFT_V2;

    constructor(address tellerNFTV2Address) {
        TELLER_NFT_V2 = TellerNFT_V2(tellerNFTV2Address);
    }

    /**
     * @notice Creates a loan with the loan request and NFTs without any collateral
     * @param assetAddress Asset address to take out a loan
     * @param amount The amount of the {assetAddress} used for the loan
     * @param duration How long the loan should last (in seconds)
     * @param nftIDs IDs of TellerNFTs to use for the loan
     */
    function takeOutLoanWithNFTsV2(
        address assetAddress,
        uint256 amount,
        uint32 duration,
        uint256[] calldata nftIDs,
        uint256[] calldata amounts
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
            NFTLib.applyToLoanV2(loan.id, nftIDs[i], amounts[i], msg.sender);

            uint256 tokenTotalBaseLoanSize = TELLER_NFT_V2.tokenBaseLoanSize(
                nftIDs[i]
            ) * amounts[i];
            allowedBaseLoanSize += tokenTotalBaseLoanSize;
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
