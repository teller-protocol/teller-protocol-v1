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

// Libraries
import { NFTLib } from "../libraries/NFTLib.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { NFTStorageLib, NFTStorage } from "../../storage/nft.sol";

contract NFTMainnetBridgingToPolygonFacet {
    address public constant POLYGON_NFT_ADDRESS =
        0x83AF2b36A3F8593203b2098CBec616A57f1A80cC;
    address public constant ERC721_PREDICATE =
        0xE6F45376f64e1F568BD1404C155e5fFD2F80F7AD;
    address public constant ERC1155_PREDICATE =
        0x0B9020d4E32990D67559b1317c7BF0C15D6EB88f;
    address public constant ROOT_CHAIN_MANAGER =
        0xA0c68C638235ee32657e8f720a23ceC1bFc77C77;

    // TELLER NFT V1
    TellerNFT public constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    // TELLER NFT V2
    MainnetTellerNFT public constant TELLER_NFT_V2 =
        MainnetTellerNFT(0x98Ca52786e967d1469090AdC075416948Ca004A7);

    /**
     * @notice It makes a function call to the ROOT_CHAIN_MANAGER "depositFor"
     *  function signature, which calls our PolyTellerNFT using the CHILD_CHAIN_MANAGER
     *  (after we map)
     * @param tokenIds the token ids that we are depositing on ROOT_CHAIN_MANAGER
     */
    function __depositForV1(uint256[] memory tokenIds) internal virtual {
        uint256[] memory amounts = new uint256[](tokenIds.length);
        for (uint256 i; i < amounts.length; i++) {
            amounts[i] = 1;
        }
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
        TELLER_NFT_V1.setApprovalForAll(ERC721_PREDICATE, true);
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
        uint256[] memory tokenIds_ = tokenIds;
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
            uint256 newTokenId = TELLER_NFT_V2.convertV1TokenId(tokenIds_[i]);
            TELLER_NFT_V1.safeTransferFrom(
                address(this),
                address(TELLER_NFT_V2),
                tokenIds_[i],
                abi.encode(newTokenId)
            );
            tokenIds_[i] = newTokenId;
        }
        __depositForV1(tokenIds_);
    }

    function bridgeNFTsV2(
        uint256[] calldata tokenIds,
        uint256[] calldata amounts
    ) external {
        // TODO: waiting for code Syed is working on
    }

    /**
     * @dev Handles the receipt of a single ERC1155 token type. This function is
     *  called at the end of a `safeTransferFrom` after the balance has been updated.
     *  To accept the transfer, this must return
     *  `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
     *  (i.e. 0xf23a6e61, or its own function selector).
     * @param operator The address which initiated the transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param id The ID of the token being transferred
     * @param value The amount of tokens being transferred
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed
     */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external returns (bytes4) {
        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }
}
