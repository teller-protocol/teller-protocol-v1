// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Contracts
import {
    ERC721Upgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import {
    IERC721ReceiverUpgradeable
} from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import { TellerNFT } from "../TellerNFT.sol";
import { MainnetTellerNFT } from "../mainnet/MainnetTellerNFT.sol";
import { NFTMigrator } from "./NFTMigrator.sol";

// Libraries
import { NFTLib } from "../libraries/NFTLib.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { NFTStorageLib, NFTStorage } from "../../storage/nft.sol";

contract NFTMainnetBridgingToPolygonFacet {
    address private constant POLYGON_NFT_ADDRESS =
        0x83AF2b36A3F8593203b2098CBec616A57f1A80cC;
    address private constant ERC1155_PREDICATE =
        0x0B9020d4E32990D67559b1317c7BF0C15D6EB88f;
    address private constant ROOT_CHAIN_MANAGER =
        0xA0c68C638235ee32657e8f720a23ceC1bFc77C77;

    // TELLER NFT V1
    TellerNFT private constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    // TELLER NFT V2
    MainnetTellerNFT private constant TELLER_NFT_V2 =
        MainnetTellerNFT(0x8f9bbbB0282699921372A134b63799a48c7d17FC);

    address private immutable migrator;

    /* Constructor */

    /**
     * @notice Sets the NFT migrator address on deployment
     * @param tellerNFTMigratorAddress The address of Teller's NFT migrator contract
     */
    constructor(address tellerNFTMigratorAddress) {
        migrator = tellerNFTMigratorAddress;
    }

    /**
     * @notice It makes a function call to the ROOT_CHAIN_MANAGER "depositFor"
     *  function signature, which calls our PolyTellerNFT using the CHILD_CHAIN_MANAGER
     *  (after we map)
     * @param tokenId the token ids that we are depositing on ROOT_CHAIN_MANAGER
     * @param amount the number of tokens to deposit
     */
    function __depositFor(uint256 tokenId, uint256 amount) internal virtual {
        uint256[] memory tokenIds = new uint256[](1);
        uint256[] memory amounts = new uint256[](1);
        for (uint256 i; i < tokenIds.length; i++) {
            tokenIds[i] = tokenId;
            amounts[i] = amount;
        }
        // Deposit tokens by calling the RootChainManager which then requests the ERC1155_PREDICATE transfer the tokens
        Address.functionCall(
            ROOT_CHAIN_MANAGER,
            abi.encodeWithSignature(
                "depositFor(address,address,bytes)",
                msg.sender,
                address(TELLER_NFT_V2),
                abi.encode(tokenIds, amounts, "")
            )
        );
    }

    /**
     * @notice It initializes our NFTBridge by approving all NFTs to the Polygon predicate contracts
     */
    function initNFTBridge() external {
        TELLER_NFT_V2.setApprovalForAll(ERC1155_PREDICATE, true);
    }

    /**
     * @notice Gets all of our NFTs (staked and unstaked) migrates to ERC1155 (if ERC721), then
     *  bridges to polygon
     * @param tokenId The tokenIds that we are sending. First array is the ERC721, if any. Second array
     *  are our ERC-1155 tokenIDs
     */
    function bridgeNFTsV1(uint256 tokenId) external {
        EnumerableSet.UintSet storage stakedNFTs = NFTLib.s().stakedNFTs[
            msg.sender
        ];
        // we are creating a new array so that we can overrwrite each element
        // with a newTokenId.
        if (EnumerableSet.contains(stakedNFTs, tokenId)) {
            NFTLib.unstake(tokenId, msg.sender);
        } else if (TELLER_NFT_V1.ownerOf(tokenId) == msg.sender) {
            TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
        }

        (bool success, bytes memory data) = migrator.delegatecall(
            abi.encodeWithSelector(NFTMigrator.migrateV1toV2.selector, tokenId)
        );
        require(success, "Teller: Migration unsuccessful");

        // Decode the new V2 token ID
        uint256 tokenIdV2 = abi.decode(data, (uint256));
        uint256 amount = 1;

        __depositFor(tokenIdV2, amount);
    }

    /**
     * @notice Gets all of our NFTs (staked and unstaked) migrates to ERC1155 (if ERC721), then
     *  bridges to polygon
     * @param tokenId The tokenIds that we are sending. First array is the ERC721, if any. Second array
     *  are our ERC-1155 tokenIDs
     * @param amountToBridge the amount of tokenIds to stake
     */
    function bridgeNFTsV2(uint256 tokenId, uint256 amountToBridge) external {
        require(amountToBridge > 0, "Teller: we must bridge more than one NFT");
        EnumerableSet.UintSet storage stakedNFTs = NFTLib.s().stakedNFTsV2[
            msg.sender
        ];
        uint256 amountStaked = NFTLib.s().stakedNFTsV2Amounts[msg.sender][
            tokenId
        ];
        if (EnumerableSet.contains(stakedNFTs, tokenId)) {
            if (amountStaked <= amountToBridge) {
                NFTLib.unstakeV2(tokenId, amountStaked, msg.sender);
            } else {
                NFTLib.unstakeV2(tokenId, amountToBridge, msg.sender);
            }
        }
        if (
            amountToBridge > amountStaked && amountToBridge - amountStaked > 0
        ) {
            TELLER_NFT_V2.safeTransferFrom(
                msg.sender,
                address(this),
                tokenId,
                amountToBridge,
                ""
            );
        }
        __depositFor(tokenId, amountToBridge);
    }
}
