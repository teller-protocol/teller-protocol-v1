// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../TellerNFT.sol";
import { MainnetNFTFacet } from "./MainnetNFTFacet.sol";

// Libraries
import { NFTLib } from "../libraries/NFTLib.sol";

contract MainnetNFTFacetMock is MainnetNFTFacet {
    // TELLER NFT V1
    TellerNFT private constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    /* Constructor */

    /**
     * @notice Sets the NFT migrator address on deployment
     * @param nftV2Address The address of Teller's NFT V2 contract
     * @param tellerNFTMigratorAddress The address of Teller's NFT migrator contract
     */
    constructor(address nftV2Address, address tellerNFTMigratorAddress)
        MainnetNFTFacet(nftV2Address, tellerNFTMigratorAddress)
    {}

    function mockStakeNFTsV1(uint256[] calldata nftIDs) external {
        for (uint256 i; i < nftIDs.length; i++) {
            TELLER_NFT_V1.transferFrom(msg.sender, address(this), nftIDs[i]);
            NFTLib.stake(nftIDs[i], msg.sender);
        }
    }
}
