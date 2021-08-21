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

/**
 * @notice This facet contains the logic for taking out a loan using the Teller NFT.
 * @dev This contract contains the base layer logic for creating and taking out
 *  a loan. It also includes the internal function {_takeOutLoanProcessNFTs} that
 *  handles the decoding of token data. As the same logic is used for Teller NFT
 *  V1 and V2 for creating and funding a loan, the logic for processing the token
 *  IDs and how many are different.
 * @dev See {MainnetCreateLoanWithNFTFacet._takeOutLoanProcessNFTs}
 * @author developer@teller.finance
 */
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
     * @param tokenData Encoded token data used to take out the loan. Data is
     *  is decode by the internal functions {_takeOutLoanProcessTokenDataVersion}
     *  and {_takeOutLoanProcessNFTs}
     */
    function takeOutLoanWithNFTs(
        address assetAddress,
        uint256 amount,
        uint32 duration,
        bytes calldata tokenData
    ) external paused(LibLoans.ID, false) {
        Loan storage loan = LibCreateLoan.initNewLoan(
            assetAddress,
            amount,
            duration,
            PlatformSettingsLib.getNFTInterestRate()
        );

        // Calculate the max loan size based on NFT V1 values
        uint8 lendingDecimals = ERC20(assetAddress).decimals();
        uint256 allowedLoanSize = _takeOutLoanProcessTokenDataVersion(
            loan.id,
            tokenData
        );
        require(
            loan.borrowedAmount <= allowedLoanSize * (10**lendingDecimals),
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

    /**
     * @notice Process the NFT data to determine which token version to use
     * @dev Only knows how to process {tokenData} for NFT V2
     * @param loanID The ID for the loan to apply the NFTs to
     * @param tokenData Encoded token ID array. NFT V2 includes the IDs and amounts
     * @return allowedLoanSize_ The max loan size calculated by the token IDs and amounts
     */
    function _takeOutLoanProcessTokenDataVersion(
        uint256 loanID,
        bytes calldata tokenData
    ) internal returns (uint256) {
        (uint16 version, bytes memory tokenData_) = abi.decode(
            tokenData,
            (uint8, bytes)
        );

        return _takeOutLoanProcessNFTs(loanID, version, tokenData_);
    }

    /**
     * @notice Process the NFT data to calculate max loan size and apply to the loan
     * @dev Only knows how to process {tokenData} for NFT V2
     * @param loanID The ID for the loan to apply the NFTs to
     * @param version The token version used to know how to decode the data
     * @param tokenData Encoded token ID array. NFT V2 includes the IDs and amounts
     * @return allowedLoanSize_ The max loan size calculated by the token IDs and amounts
     */
    function _takeOutLoanProcessNFTs(
        uint256 loanID,
        uint16 version,
        bytes memory tokenData
    ) internal virtual returns (uint256 allowedLoanSize_) {
        if ((2 & version) == 2) {
            (
                uint256[] memory nftIDsV1,
                uint256[] memory nftIDs,
                uint256[] memory amounts
            ) = abi.decode(tokenData, (uint256[], uint256[], uint256[]));
            for (uint256 i; i < nftIDs.length; i++) {
                NFTLib.applyToLoanV2(loanID, nftIDs[i], amounts[i], msg.sender);

                uint256 baseLoanSize = TELLER_NFT_V2.tokenBaseLoanSize(
                    nftIDs[i]
                );
                allowedLoanSize_ += baseLoanSize * amounts[i];
            }
        }
    }
}
