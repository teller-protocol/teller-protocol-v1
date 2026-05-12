// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

// Contexts
import { RolesMods } from "../contexts2/access-control/roles/RolesMods.sol";
import {
    ReentryMods
} from "../contexts2/access-control/reentry/ReentryMods.sol";
import { PausableMods } from "../settings/pausable/PausableMods.sol";
import { ADMIN } from "../shared/roles.sol";

// Libraries
import {
    EnumerableSet
} from "@openzeppelin/contracts/utils/structs/EnumerableSet.sol";
import { NFTLib } from "../nft/libraries/NFTLib.sol";
import { LibLoans } from "./libraries/LibLoans.sol";

// Storage
import { LoanStatus } from "../storage/market.sol";

/**
 * @notice Narrow remediation facet for loans whose V1 ERC721 NFT collateral is
 *         no longer held by the Diamond (it was migrated into the V2 ERC1155
 *         in November 2021).
 *
 * Background: `MainnetRepayFacet._liquidateNFT` calls `NFTLib.liquidateNFT`,
 * which iterates `NFTStorage.loanNFTs[loanID]` and tries to
 * `transferFrom(diamond, controller, nftID)` on the V1 ERC721. Because the
 * Diamond no longer owns those token IDs, the transfer reverts and
 * liquidation is permanently blocked, even though the loan is overdue and
 * the escrow holds sufficient value to repay the lending pool.
 *
 * This facet exposes a single ADMIN-gated function that removes the dangling
 * V1 NFT references from the affected loan records. After execution, the
 * existing `liquidateLoan` flow works normally: any liquidator with capital
 * can settle the loan against the lending pool and collect the standard
 * liquidator reward. No funds move as a result of calling this facet.
 *
 * Scope guards:
 *  - ADMIN role only.
 *  - Only acts on loans whose `loanNFTs` set is non-empty (idempotent).
 *  - Only acts on loans whose status is Active (terminal states are skipped).
 *  - Does not touch V2 NFTs, escrow balances, loan debt, collateral, or
 *    loan status.
 */
contract EscrowRecoveryFacet is RolesMods, ReentryMods, PausableMods {
    using EnumerableSet for EnumerableSet.UintSet;

    /**
     * @notice Emitted once per loan whose dangling V1 NFT references were
     *         removed. The full list of removed IDs is included for the
     *         on-chain audit trail.
     */
    event V1NFTReferencesCleared(uint256 indexed loanID, uint256[] nftIDs);

    /**
     * @notice Removes all V1 NFT references from each listed loan so that
     *         the existing liquidation flow can proceed.
     * @param loanIDs Loan IDs to clear. Loans not in `Active` status or
     *        with no V1 NFT references are skipped silently.
     */
    function adminClearV1NFTs(uint256[] calldata loanIDs)
        external
        authorized(ADMIN, msg.sender)
        paused("", false)
        nonReentry("")
    {
        for (uint256 i; i < loanIDs.length; i++) {
            uint256 loanID = loanIDs[i];

            if (LibLoans.loan(loanID).status != LoanStatus.Active) continue;

            EnumerableSet.UintSet storage nfts = NFTLib.s().loanNFTs[loanID];
            uint256 len = nfts.length();
            if (len == 0) continue;

            uint256[] memory removed = new uint256[](len);
            for (uint256 j = len; j > 0; j--) {
                uint256 nftID = nfts.at(j - 1);
                removed[j - 1] = nftID;
                nfts.remove(nftID);
            }

            emit V1NFTReferencesCleared(loanID, removed);
        }
    }

    /**
     * @notice Returns the V1 ERC721 NFT IDs currently referenced by `loanID`.
     *         Useful for off-chain verification before and after running
     *         `adminClearV1NFTs`.
     */
    function getLoanV1NFTs(uint256 loanID)
        external
        view
        returns (uint256[] memory ids_)
    {
        EnumerableSet.UintSet storage nfts = NFTLib.s().loanNFTs[loanID];
        uint256 len = nfts.length();
        ids_ = new uint256[](len);
        for (uint256 i; i < len; i++) {
            ids_[i] = nfts.at(i);
        }
    }
}
