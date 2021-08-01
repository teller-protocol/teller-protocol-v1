// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contracts
import { TellerNFT } from "../nft/TellerNFT.sol";
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import { ADMIN, AUTHORIZED } from "../shared/roles.sol";
import { NFTMigrator } from "./mainnet/NFTMigrator.sol";

// Libraries
import { NFTLib } from "./libraries/NFTLib.sol";
import { RolesLib } from "../contexts2/access-control/roles/RolesLib.sol";
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";

contract NFTFacet is RolesMods {
    address internal immutable migrator;

    /* Constructor */

    /**
     * @notice Sets the NFT migrator address on deployment
     * @param tellerNFTMigratorAddress The address of Teller's NFT migrator contract
     */
    constructor(address tellerNFTMigratorAddress) {
        migrator = tellerNFTMigratorAddress;
    }

    /**
     * @notice it gets the staked NFTs mapped to an owner's address
     * @return staked_ the returned staked NFTs mapped to an owner's address
     * @return amounts_ the amounts of NFTs mapped to the ids
     */
    function getStakedNFTsV2(address nftOwner)
        public
        view
        returns (uint256[] memory staked_, uint256[] memory amounts_)
    {
        (staked_, amounts_) = NFTLib.stakedNFTsV2(nftOwner);
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
    function unstakeNFTsV2(uint256[] calldata nftIDs) external {
        for (uint256 i; i < nftIDs.length; i++) {
            // Unstake NFTs by requiring that removing of the staked NFTs by
            // the msg.sender is a success. If it isn't, we revert
            require(
                NFTLib.unstake(nftIDs[i]),
                "Teller: not the owner of the NFT ID!"
            );
            (bool success, bytes memory data) = migrator.delegatecall(
                abi.encodeWithSelector(
                    NFTMigrator.migrateV1toV2.selector,
                    nftIDs[i]
                )
            );
            require(success, "Teller: Migration unseccessful");
            uint256 V2Id = abi.decode(data, (uint256));
            NFTMigrator(migrator).TELLER_NFT_V2().safeTransferFrom(
                address(this),
                msg.sender,
                V2Id,
                1,
                data
            );
        }
    }

    /**
     * @notice Transfers multiple Teller NFTs to Diamond and applies user stake.
     * @param nftIDs IDs of Teller NFTs to stake.
     */
    function stakeNFTsV2(uint256[] calldata nftIDs) external {
        for (uint256 i; i < nftIDs.length; i++) {
            // Stake NFT and transfer into diamond
            NFTLib.stake(nftIDs[i], msg.sender);
        }
        // Give the caller authorization to protocol
        RolesLib.grantRole(AUTHORIZED, msg.sender);
    }
}
