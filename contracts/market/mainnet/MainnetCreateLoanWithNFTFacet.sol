// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { CreateLoanWithNFTFacet } from "../CreateLoanWithNFTFacet.sol";
import { TellerNFT_V2 } from "../../nft/TellerNFT_V2.sol";

// Libraries
import { NFTLib } from "../../nft/libraries/NFTLib.sol";

contract MainnetCreateLoanWithNFTFacet is CreateLoanWithNFTFacet {
    constructor(address tellerNFTV2Address)
        CreateLoanWithNFTFacet(tellerNFTV2Address)
    {}

    /**
     * @notice Process the NFT data to calculate max loan size and apply to the loan
     * @dev Only knows how to process {tokenData} for NFT V1, otherwise calls super
     * @param loanID The ID for the loan to apply the NFTs to
     * @param version The token version used to know how to decode the data
     * @param tokenData Encoded token ID array. NFT V1 includes just the IDs
     * @return allowedLoanSize_ The max loan size calculated by the token IDs
     */
    function _takeOutLoanProcessNFTs(
        uint256 loanID,
        uint16 version,
        bytes memory tokenData
    ) internal virtual override returns (uint256 allowedLoanSize_) {
        uint256 v1Amount;
        if ((1 & version) == 1) {
            uint256[] memory nftIDs = abi.decode(tokenData, (uint256[]));
            for (uint256 i; i < nftIDs.length; i++) {
                NFTLib.applyToLoan(loanID, nftIDs[i], msg.sender);

                // add to allowedLoanSize
                allowedLoanSize_ += NFTLib.s().nftDictionary.tokenBaseLoanSize(
                    nftIDs[i]
                );
                v1Amount += allowedLoanSize_;
            }
        }
        allowedLoanSize_ =
            super._takeOutLoanProcessNFTs(loanID, version, tokenData) +
            v1Amount;
    }
}
