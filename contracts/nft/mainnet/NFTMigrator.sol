// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Contracts
import { TellerNFT } from "../TellerNFT.sol";
import { MainnetTellerNFT } from "../mainnet/MainnetTellerNFT.sol";

contract NFTMigrator {
    // TELLER NFT V1
    TellerNFT internal constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    // TELLER NFT V2
    MainnetTellerNFT internal constant TELLER_NFT_V2 =
        MainnetTellerNFT(0x8f9bbbB0282699921372A134b63799a48c7d17FC);

    /**
     * @notice gets all of our NFTs (staked and unstaked) migrates to ERC1155 (if ERC721), then
     * bridges to polygon
     * @param V1TokenId the tokenId that we are sending. First array is the ERC721, if any. Second array
     * are our ERC-1155 tokenIDs
     */
    function migrateV1toV2(uint256 V1TokenId)
        external
        returns (uint256 newTokenId_)
    {
        newTokenId_ = TELLER_NFT_V2.convertV1TokenId(V1TokenId);
        TELLER_NFT_V1.safeTransferFrom(
            address(this),
            address(TELLER_NFT_V2),
            V1TokenId,
            abi.encode(newTokenId_)
        );
    }
}
