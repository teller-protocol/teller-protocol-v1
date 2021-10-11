// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../nft/TellerNFT.sol";
import { TellerNFT_V2 } from "../nft/TellerNFT_V2.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Libraries
import { NFTLib } from "./libraries/NFTLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { NumbersLib } from "../shared/libraries/NumbersLib.sol";

contract NFTFacet is RolesMods {
    // TELLER NFT V2
    TellerNFT_V2 private immutable TELLER_NFT_V2;

    /* Constructor */

    constructor(address nftV2Address) {
        TELLER_NFT_V2 = TellerNFT_V2(nftV2Address);
    }

    /**
     * @notice it gets the staked NFTs mapped to an owner's address
     * @param nftOwner The address of the NFT owner.
     * @return staked_ the returned staked NFTs mapped to an owner's address
     * @return amounts_ the amounts of NFTs mapped to the ids
     */
    function getStakedNFTsV2(address nftOwner)
        public
        view
        returns (uint256[] memory staked_, uint256[] memory amounts_)
    {
        EnumerableSet.UintSet storage nftsV2 = NFTLib.s().stakedNFTsV2[
            nftOwner
        ];
        staked_ = new uint256[](EnumerableSet.length(nftsV2));
        amounts_ = new uint256[](EnumerableSet.length(nftsV2));
        for (uint256 i; i < staked_.length; i++) {
            staked_[i] = EnumerableSet.at(nftsV2, i);
            amounts_[i] = NFTLib.s().stakedNFTsV2Amounts[nftOwner][staked_[i]];
        }
    }

    /**
     * @notice it returns the NFTs mapped to a loan
     * @param loanID the identifier of the respective loan to get the loan NFTs from
     * @return loanNFTs_ the loan NFTs mapped to a loan ID
     * @return amounts_ the amounts of NFTs mapped to the ids
     */
    function getLoanNFTsV2(uint256 loanID)
        external
        view
        returns (uint256[] memory loanNFTs_, uint256[] memory amounts_)
    {
        EnumerableSet.UintSet storage nftsV2 = NFTLib.s().loanNFTsV2[loanID];
        loanNFTs_ = new uint256[](EnumerableSet.length(nftsV2));
        amounts_ = new uint256[](EnumerableSet.length(nftsV2));
        for (uint256 i; i < EnumerableSet.length(nftsV2); i++) {
            loanNFTs_[i] = EnumerableSet.at(nftsV2, i);
            amounts_[i] = NFTLib.s().loanNFTsV2Amounts[loanID][loanNFTs_[i]];
        }
    }

    /**
     * @notice it unstakes the user's NFTs and transfers it from the diamond
     * back to the user
     * @param nftIDs the nftIDs to unstake
     */
    function unstakeNFTsV2(
        uint256[] calldata nftIDs,
        uint256[] calldata nftAmounts
    ) external {
        address owner = msg.sender;

        for (uint256 i; i < nftIDs.length; i++) {
            // Unstake NFTs by requiring that removing of the staked NFTs by
            // the msg.sender is a success. If it isn't, we revert
            require(
                NFTLib.unstakeV2(nftIDs[i], nftAmounts[i], owner),
                "Teller: not the owner of the NFT ID!"
            );

            TELLER_NFT_V2.safeTransferFrom(
                address(this),
                owner,
                nftIDs[i], //v2_id
                nftAmounts[i],
                ""
            );
        }
    }

    /**
     * @notice When a NFT V2 is transferred to the protocol, it is automatically staked for the owner.
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
        require(
            msg.sender == address(TELLER_NFT_V2),
            "Teller: unaccepted 1155"
        );

        // see NFTMainnetBridginToPolygonFacet bridgeNFTsV2(): we are either migrating or transferring
        // the V2 NFT, therefore we don't them to be staked if the Diamond initiates the transfer. It should
        // only be staked if it's a user who initiates the transfer
        if (operator != address(this)) {
            __stakeNFTV2(from, id, value);
        }

        return
            bytes4(
                keccak256(
                    "onERC1155Received(address,address,uint256,uint256,bytes)"
                )
            );
    }

    /**
     * @notice When a NFT V2 is transferred to the protocol, it is automatically staked for the owner.
     * @dev Handles the receipt of a multiple ERC1155 token types. This function
     *  is called at the end of a `safeBatchTransferFrom` after the balances have
     *  been updated. To accept the transfer(s), this must return
     *  `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))`
     *  (i.e. 0xbc197c81, or its own function selector).
     * @param operator The address which initiated the batch transfer (i.e. msg.sender)
     * @param from The address which previously owned the token
     * @param ids An array containing ids of each token being transferred (order and length must match values array)
     * @param values An array containing amounts of each token being transferred (order and length must match ids array)
     * @param data Additional data with no specified format
     * @return `bytes4(keccak256("onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"))` if transfer is allowed
     */
    function onERC1155BatchReceived(
        address operator,
        address from,
        uint256[] calldata ids,
        uint256[] calldata values,
        bytes calldata data
    ) external returns (bytes4) {
        require(
            msg.sender == address(TELLER_NFT_V2),
            "Teller: unaccepted 1155"
        );
        for (uint256 i; i < ids.length; i++) {
            __stakeNFTV2(from, ids[i], values[i]);
        }

        return
            bytes4(
                keccak256(
                    "onERC1155BatchReceived(address,address,uint256[],uint256[],bytes)"
                )
            );
    }

    function __stakeNFTV2(
        address owner,
        uint256 id,
        uint256 value
    ) private {
        NFTLib.stakeV2(id, value, owner);
    }
}
