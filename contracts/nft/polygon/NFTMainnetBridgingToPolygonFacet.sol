// SPDX-License-Identifier: MIT
pragma solidity ^0.8.3;

// Contracts
import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import { IERC1155ReceiverUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC1155/IERC1155ReceiverUpgradeable.sol";
import { IERC721ReceiverUpgradeable } from "@openzeppelin/contracts-upgradeable/token/ERC721/IERC721ReceiverUpgradeable.sol";
import { TellerNFT } from "../TellerNFT.sol";
import { MainnetTellerNFT } from "../mainnet/MainnetTellerNFT.sol";

// Libraries
import { NFTLib } from "../libraries/NFTLib.sol";
import { Address } from "@openzeppelin/contracts/utils/Address.sol";
import { EnumerableSet } from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

// Storage
import { NFTStorageLib, NFTStorage } from "../../storage/nft.sol";
import "hardhat/console.sol";

contract NFTMainnetBridgingToPolygonFacet is IERC1155ReceiverUpgradeable {
    // immutable and constant addresses
    address public immutable POLYGON_NFT_ADDRESS;
    address public constant ERC721_PREDICATE =
        0x74D83801586E9D3C4dc45FfCD30B54eA9C88cf9b;
    address public constant ROOT_CHAIN_MANAGER =
        0xD4888faB8bd39A663B63161F5eE1Eae31a25B653;

    // TELLER NFT V1
    TellerNFT public constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    // TELLER NFT V2
    MainnetTellerNFT public constant TELLER_NFT_V2 =
        MainnetTellerNFT(0x98Ca52786e967d1469090AdC075416948Ca004A7);

    constructor(address polygonNFT) {
        POLYGON_NFT_ADDRESS = polygonNFT;
    }

    /**
     * @notice it makes a function call to the ROOT_CHAIN_MANAGER "depositFor"
     * function signature, which calls our PolyTellerNFT using the CHILD_CHAIN_MANAGER
     * (after we map)
     * @param tokenIds the token ids that we are depositing on ROOT_CHAIN_MANAGER
     */
    function __depositFor(uint256[] memory tokenIds) internal virtual {
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
     * @notice it initializes our NFTBridge by approving all NFTs to the Polygon ERC721_Predicate
     */
    function initNFTBridge() external {
        TELLER_NFT_V1.setApprovalForAll(ERC721_PREDICATE, true);
    }

    /**
     * @notice gets all of our NFTs (staked and unstaked) migrates to ERC1155 (if ERC721), then
     * bridges to polygon
     * @param tokenIds the tokenIds that we are sending. First array is the ERC721, if any. Second array
     * are our ERC-1155 tokenIDs
     */
    function bridgeNFTs(uint256[][2] calldata tokenIds) external {
        EnumerableSet.UintSet storage stakedNFTs = NFTLib.s().stakedNFTs[
            msg.sender
        ];

        // we are creating a new array so that we can overrwrite each element
        // with a newTokenId.
        uint256[][2] memory tokenIds_ = tokenIds;
        for (uint256 i; i < tokenIds_[0].length; i++) {
            if (EnumerableSet.contains(stakedNFTs, tokenIds_[0][i])) {
                NFTLib.unstake(tokenIds_[0][i]);
            } else if (TELLER_NFT_V1.ownerOf(tokenIds_[0][i]) == msg.sender) {
                TELLER_NFT_V1.transferFrom(
                    msg.sender,
                    address(this),
                    tokenIds_[0][i]
                );
            }
            uint256 newTokenId = TELLER_NFT_V2.convertV1TokenId(
                tokenIds_[0][i]
            );
            TELLER_NFT_V1.safeTransferFrom(
                address(this),
                address(TELLER_NFT_V2),
                tokenIds_[0][i],
                abi.encode(newTokenId)
            );
            tokenIds_[0][i] = newTokenId;
        }
        __depositFor(tokenIds_[0]);
    }

    /**
     * @dev Returns true if this contract implements the interface defined by
     * `interfaceId`. See the corresponding
     * https://eips.ethereum.org/EIPS/eip-165#how-interfaces-are-identified[EIP section]
     * to learn more about how these ids are created.
     *
     * This function call must use less than 30 000 gas.
     */
    // function supportsInterface(bytes4 interfaceId)
    //     external
    //     view
    //     override
    //     returns (bool)
    // {}

    // /**
    //     @dev Handles the receipt of a single ERC1155 token type. This function is
    //     called at the end of a `safeTransferFrom` after the balance has been updated.
    //     To accept the transfer, this must return
    //     `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))`
    //     (i.e. 0xf23a6e61, or its own function selector).
    //     @param operator The address which initiated the transfer (i.e. msg.sender)
    //     @param from The address which previously owned the token
    //     @param id The ID of the token being transferred
    //     @param value The amount of tokens being transferred
    //     @param data Additional data with no specified format
    //     @return `bytes4(keccak256("onERC1155Received(address,address,uint256,uint256,bytes)"))` if transfer is allowed
    // */
    function onERC1155Received(
        address operator,
        address from,
        uint256 id,
        uint256 value,
        bytes calldata data
    ) external override returns (bytes4) {
        return IERC1155ReceiverUpgradeable.onERC1155Received.selector;
    }

    // /**
    //     @dev Handles the receipt of a multiple ERC1155 token types. This function
    //     is called at the end of a `safeBatchTransferFrom` after the balances have
    //     been updated. To accept the transfer(s), this must return
    //     `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
    //     (i.e. 0xbc197c81, or its own function selector).
    //     @param operator The address which initiated the batch transfer (i.e. msg.sender)
    //     @param from The address which previously owned the token
    //     @param ids An array containing ids of each token being transferred (order and length must match values array)
    //     @param values An array containing amounts of each token being transferred (order and length must match ids array)
    //     @param data Additional data with no specified format
    //     @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
    // */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external override returns (bytes4) {}
}
