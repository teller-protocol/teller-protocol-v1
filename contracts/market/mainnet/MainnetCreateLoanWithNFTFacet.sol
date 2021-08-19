// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { CreateLoanWithNFTFacet } from "../CreateLoanWithNFTFacet.sol";

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
        if (version == 1) {
            uint256[] memory nftIDs = abi.decode(tokenData, (uint256[]));
            for (uint256 i; i < nftIDs.length; i++) {
                NFTLib.applyToLoan(loanID, nftIDs[i], msg.sender);

                allowedLoanSize_ += NFTLib.s().nftDictionary.tokenBaseLoanSize(
                    nftIDs[i]
                );
            }
        } else if (version == 3) {
            // we only need the NFTV1IDs here
            (
                uint256[] memory nftV1IDs,
                uint256[] memory nftV2IDs,
                uint256[] memory nftV2amounts
            ) = abi.decode(tokenData, (uint256[], uint256[], uint256[]));
            for (uint256 i; i < nftV1IDs.length; i++) {
                NFTLib.applyToLoan(loanID, nftV1IDs[i], msg.sender);

                allowedLoanSize_ += NFTLib.s().nftDictionary.tokenBaseLoanSize(
                    nftV1IDs[i]
                );
            }
        } else {
            allowedLoanSize_ = super._takeOutLoanProcessNFTs(
                loanID,
                version,
                tokenData
            );
        }
    }
}
