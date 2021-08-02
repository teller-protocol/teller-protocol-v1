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
     * @param tokenIds the token ids that we are depositing on ROOT_CHAIN_MANAGER
     */
    function __depositFor(uint256[] memory tokenIds, uint256[] memory amounts)
        internal
        virtual
    {
        // Deposit tokens by calling the RootChainManager which then has the ERC721_PREDICATE transfer the tokens
        Address.functionCall(
            ROOT_CHAIN_MANAGER,
            abi.encodeWithSignature(
                "depositFor(address,address,bytes)",
                msg.sender,
                address(TELLER_NFT_V2),
                abi.encode(tokenIds, amounts)
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
     * @param tokenIds The tokenIds that we are sending. First array is the ERC721, if any. Second array
     *  are our ERC-1155 tokenIDs
     */
    function bridgeNFTsV1(uint256[] calldata tokenIds) external {
        EnumerableSet.UintSet storage stakedNFTs = NFTLib.s().stakedNFTs[
            msg.sender
        ];

        // we are creating a new array so that we can overrwrite each element
        // with a newTokenId.
        uint256[] memory tokenIds_ = new uint256[](tokenIds.length);
        uint256[] memory amounts_ = new uint256[](tokenIds.length);
        for (uint256 i; i < tokenIds_.length; i++) {
            if (EnumerableSet.contains(stakedNFTs, tokenIds_[i])) {
                NFTLib.unstake(tokenIds_[i]);
            } else if (TELLER_NFT_V1.ownerOf(tokenIds_[i]) == msg.sender) {
                TELLER_NFT_V1.transferFrom(
                    msg.sender,
                    address(this),
                    tokenIds_[i]
                );
            }

            (bool success, bytes memory data) = migrator.delegatecall(
                abi.encodeWithSelector(
                    NFTMigrator.migrateV1toV2.selector,
                    tokenIds_[i]
                )
            );
            require(success, "Teller: Migration unsuccessful");

            // Decode the new V2 token ID
            tokenIds_[i] = abi.decode(data, (uint256));
            amounts_[i] = 1;
        }
        __depositFor(tokenIds_, amounts_);
    }

    function bridgeNFTsV2(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external {
        // TODO: waiting for code Syed is working on
    }
}
