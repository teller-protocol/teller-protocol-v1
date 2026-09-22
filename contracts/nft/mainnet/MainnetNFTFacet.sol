// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../../nft/TellerNFT.sol";
import { TellerNFT_V2 } from "../../nft/TellerNFT_V2.sol";
import { MainnetTellerNFT } from "./MainnetTellerNFT.sol";
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
     * @notice How a given staked V1 NFT ID can be settled back to its staker.
     * @param Unavailable The diamond neither holds the V1 NFT nor a V2 token to
     *  settle with. The claim is real but currently unfunded.
     * @param ViaMigration The diamond still custodies the V1 NFT, so it is
     *  migrated to V2 on the spot and handed over.
     * @param FromInventory The V1 NFT has already been migrated away, so the
     *  claim is settled out of the diamond's existing V2 balance.
     */
    enum Settlement {
        Unavailable,
        ViaMigration,
        FromInventory
    }

    /**
     * @notice it unstakes the user's NFTs and transfers it from the diamond
     * back to the user
     * @dev Every V1 NFT the diamond ever custodied has since been migrated into
     *  the V2 contract, which has no way to send an ERC721 back out. Unstaking
     *  therefore cannot rely on `migrateV1toV2` succeeding: it only runs while
     *  the diamond genuinely still owns the V1 NFT. Otherwise the staker is
     *  settled from the diamond's V2 inventory, which is what the migration
     *  would have produced anyway.
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

            uint256 V2Id = MainnetTellerNFT(address(TELLER_NFT_V2))
                .convertV1TokenId(nftIDs[i]);

            // Only migrate while the V1 NFT is actually held here. Calling the
            // migrator without it reverts and would strand the staker forever.
            if (TELLER_NFT_V1.ownerOf(nftIDs[i]) == address(this)) {
                (bool success, ) = migrator.delegatecall(
                    abi.encodeWithSelector(
                        NFTMigrator.migrateV1toV2.selector,
                        nftIDs[i]
                    )
                );
                require(success, "Teller: Migration unsuccessful");
            }

            require(
                TELLER_NFT_V2.balanceOf(address(this), V2Id) > 0,
                "Teller: NFT claim not funded"
            );

            TELLER_NFT_V2.safeTransferFrom(
                address(this),
                msg.sender,
                V2Id,
                1, //amount
                ""
            );
        }
    }

    /**
     * @notice it reports, per staked V1 NFT, whether unstaking can currently be
     *  settled and with which V2 token ID
     * @dev Lets a caller drop the unfunded IDs before submitting, instead of
     *  having one unfunded ID revert the whole batch.
     * @param nftOwner the staker to preview
     * @return v1IDs_ the V1 NFT IDs recorded as staked by {nftOwner}
     * @return v2IDs_ the V2 token ID each V1 NFT ID settles to
     * @return settlements_ how each ID would be settled
     */
    function previewUnstakeNFTs(address nftOwner)
        external
        view
        returns (
            uint256[] memory v1IDs_,
            uint256[] memory v2IDs_,
            Settlement[] memory settlements_
        )
    {
        v1IDs_ = getStakedNFTs(nftOwner);
        v2IDs_ = new uint256[](v1IDs_.length);
        settlements_ = new Settlement[](v1IDs_.length);

        for (uint256 i; i < v1IDs_.length; i++) {
            try
                MainnetTellerNFT(address(TELLER_NFT_V2)).convertV1TokenId(
                    v1IDs_[i]
                )
            returns (uint256 v2ID) {
                v2IDs_[i] = v2ID;

                if (TELLER_NFT_V1.ownerOf(v1IDs_[i]) == address(this)) {
                    settlements_[i] = Settlement.ViaMigration;
                } else if (TELLER_NFT_V2.balanceOf(address(this), v2ID) > 0) {
                    settlements_[i] = Settlement.FromInventory;
                }
            } catch {
                // leaves v2IDs_[i] == 0 and Settlement.Unavailable
            }
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
