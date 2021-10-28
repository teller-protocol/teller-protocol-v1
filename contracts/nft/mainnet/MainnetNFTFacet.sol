// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../../nft/TellerNFT.sol";
import { TellerNFT_V2 } from "../../nft/TellerNFT_V2.sol";
import { NFTFacet } from "../NFTFacet.sol";
import { NFTMigrator } from "./NFTMigrator.sol";
import { ADMIN } from "../../shared/roles.sol";

// Libraries
import { NFTLib } from "../libraries/NFTLib.sol";
import { RolesLib } from "../../contexts2/access-control/roles/RolesLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract MainnetNFTFacet is NFTFacet {
    // TELLER NFT V1
    TellerNFT private constant TELLER_NFT_V1 =
        TellerNFT(0x2ceB85a2402C94305526ab108e7597a102D6C175);

    // TELLER NFT V2
    TellerNFT_V2 private immutable TELLER_NFT_V2;

    address internal immutable migrator;

    /* Constructor */

    /**
     * @notice Sets the NFT migrator address on deployment
     * @param nftV2Address The address of Teller's NFT V2 contract
     * @param tellerNFTMigratorAddress The address of Teller's NFT migrator contract
     */
    constructor(address nftV2Address, address tellerNFTMigratorAddress)
        NFTFacet(nftV2Address)
    {
        TELLER_NFT_V2 = TellerNFT_V2(nftV2Address);
        migrator = tellerNFTMigratorAddress;
    }

    /**
     * @notice it gets the staked NFTs mapped to an owner's address
     * @param nftOwner the owner of the staked NFTs to pull from
     * @return staked_ the returned staked NFTs mapped to an owner's address
     */
    function getStakedNFTs(address nftOwner)
        public
        view
        returns (uint256[] memory staked_)
    {
        EnumerableSet.UintSet storage nfts = NFTLib.s().stakedNFTs[nftOwner];
        staked_ = new uint256[](EnumerableSet.length(nfts));
        for (uint256 i; i < staked_.length; i++) {
            // EnumerableSet.contains(nfts)
            staked_[i] = EnumerableSet.at(nfts, i);
        }
    }

    /**
     * @notice it returns the NFTs mapped to a loan
     * @param loanID the identifier of the respective loan to get the loan NFTs from
     * @return loanNFTs the loan NFTs mapped to a loan ID
     */
    function getLoanNFTs(uint256 loanID)
        external
        view
        returns (uint256[] memory loanNFTs)
    {
        EnumerableSet.UintSet storage nfts = NFTLib.s().loanNFTs[loanID];
        loanNFTs = new uint256[](EnumerableSet.length(nfts));
        for (uint256 i; i < EnumerableSet.length(nfts); i++) {
            loanNFTs[i] = EnumerableSet.at(nfts, i);
        }
    }

    /**
     * @notice it unstakes the user's NFTs and transfers it from the diamond
     * back to the user
     * @param nftIDs the nftIDs to unstake
     */
    function unstakeNFTs(uint256[] calldata nftIDs) external {
        for (uint256 i; i < nftIDs.length; i++) {
            // Unstake NFTs by requiring that removing of the staked NFTs by
            // the msg.sender is a success. If it isn't, we revert
            require(
                NFTLib.unstake(nftIDs[i], msg.sender),
                "Teller: not the owner of the NFT ID!"
            );
            (bool success, bytes memory data) = migrator.delegatecall(
                abi.encodeWithSelector(
                    NFTMigrator.migrateV1toV2.selector,
                    nftIDs[i]
                )
            );
            require(success, "Teller: Migration unsuccessful");
            uint256 V2Id = abi.decode(data, (uint256));
            TELLER_NFT_V2.safeTransferFrom(
                address(this),
                msg.sender,
                V2Id,
                1, //amount
                data
            );
        }
    }

    /**
     * @notice Transfers multiple Teller NFTs to Diamond and applies user stake.
     * @param nftIDs IDs of Teller NFTs to stake.
     */
    function stakeNFTs(uint256[] calldata nftIDs) external {
        for (uint256 i; i < nftIDs.length; i++) {
            // Stake NFT and transfer into diamond
            //NFTLib.stake(nftIDs[i], msg.sender);

            TELLER_NFT_V1.transferFrom(msg.sender, address(this), nftIDs[i]);

            (bool success, bytes memory data) = migrator.delegatecall(
                abi.encodeWithSelector(
                    NFTMigrator.migrateV1toV2.selector,
                    nftIDs[i]
                )
            );
            require(success, "Teller: Migration unsuccessful");

            uint256 V2Id = abi.decode(data, (uint256));

            NFTLib.stakeV2(V2Id, 1, msg.sender);
        }
    }
}
