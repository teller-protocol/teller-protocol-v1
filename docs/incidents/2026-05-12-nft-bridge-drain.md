# 12 May 2026 — staked V1 NFTs drained through `bridgeNFTsV1`

## Summary

689 Teller NFTs held in custody by the diamond on behalf of 352 stakers were
migrated and bridged to Polygon by two addresses that owned none of them, over
roughly three hours on 12 May 2026. The victims' staking records were never
cleared, so the protocol still credits them with NFTs it no longer holds — and
because unstaking tries to move the underlying V1 NFT, those stakers cannot
unstake at all.

The hole was closed by the facet upgrade in PR #529. The corrupted accounting
it left behind was not, which is why stakers are still stuck.

## Root cause

`NFTMainnetBridgingToPolygonFacet.bridgeNFTsV1` took the NFT from one of two
places and then, unconditionally, migrated and bridged it:

```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstake(tokenId, msg.sender);
} else if (TELLER_NFT_V1.ownerOf(tokenId) == msg.sender) {
    TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
}
// no else — execution simply continues

migrator.delegatecall(migrateV1toV2(tokenId));
__depositFor(tokenIdV2, 1);
```

When the caller neither had the NFT staked nor owned it, **both branches were
skipped and nothing reverted**. Execution fell through to the migrator, which
runs under `delegatecall` and so acts as the diamond:

```solidity
TELLER_NFT_V1.safeTransferFrom(address(this), address(TELLER_NFT_V2), V1TokenId, ...)
```

The diamond *did* own the NFT — because some other user had staked it. So the
victim's NFT was migrated to V2, and `__depositFor` then bridged the resulting
ERC1155 to Polygon crediting `msg.sender`, the caller.

Two things made this permanent:

- `stakedNFTs[victim]` was never touched, so the protocol's books still show
  the NFT as staked by its rightful owner.
- `MainnetTellerNFT` accepts ERC721s but has no function to send one back out.
  The V1 NFTs are locked in it forever.

## What happened

| | |
|---|---|
| Window | 12 May 2026, 03:10–06:29 UTC |
| Method | 689 single-token `bridgeNFTsV1` calls (selector `0x06eb842b`) |
| Caller 1 | `0x4a9a6a2171244bad773f1b3eb9c07d921f36835f` — 373 NFTs, 03:10–05:41 |
| Caller 2 | `0x7550c40e188b3da9349c9d7b941a699c2f62e0e3` — 316 NFTs, 05:44–06:29 |
| NFTs taken | 689, **none** of which belonged to the caller |
| Stakers affected | 352 |

The fix (facet `0x8Bae586f7899df13d6bce0831971B82b53Af974f`) went live at block
25094012. The last drain transfer was at block 25077249, so nothing has been
taken since.

Both caller addresses hold zero Teller NFTs on Polygon today, so there is
nothing to claw back on-chain.

## Current state

- The diamond holds **0** V1 NFTs. All 1608 sit locked in the V2 contract.
- **350** stakers still carry **687** `stakedNFTs` records. Every one of them
  traces to this incident; there are no unrelated legacy records.
- `unstakeNFTs` reverts with `Teller: Migration unsuccessful` for all of them,
  because it calls the migrator for a V1 NFT the diamond does not own.
- Because `unstakeNFTs` loops over its whole argument array, one affected ID is
  enough to revert an entire batch.

Balance sheet in V2 tokens:

| | units |
|---|---|
| Owed to the 350 V1 stakers | 687 |
| Owed to 26 live V2 stakers | 121 |
| **Total owed** | **808** |
| Held by the diamond | 157 |
| **Shortfall** | **651** |

Because the shortfall is per token ID and surpluses on one ID cannot cover
another, the mint needed is **655 units across 110 token IDs**.

## Remedy

**1. Upgrade `MainnetNFTFacet`.** `unstakeNFTs` now only calls the migrator
while the diamond actually holds the V1 NFT, and otherwise settles the staker
from the diamond's V2 inventory — which is exactly what the migration would
have produced. A new `previewUnstakeNFTs` view reports, per staked ID, whether
it can be settled now, so the frontend can drop unfunded IDs instead of letting
one of them revert the batch.

**2. Fund the shortfall.** Mint the missing V2 units to the diamond from the
`MINTER` role on `MainnetTellerNFT` before announcing recovery, or stakers will
hit `Teller: NFT claim not funded`. Regenerate the current plan with:

```
yarn hardhat nft:audit-stale-stakes --network mainnet
```

which writes `stale-stakes.csv` (staker → V1 ID → V2 ID) and `mint-plan.csv`
(V2 ID → units to mint).

Note that `MainnetTellerNFT.mint` picks a pseudo-random token within a tier
rather than an exact ID, so covering specific IDs needs either a targeted mint
path or acquiring the exact tokens.

**3. Order of operations.** Fund first, then upgrade, then tell stakers to
unstake. Upgrading before funding leaves them hitting a different revert.

## Not fixed here

`bridgeNFTsV1` reverts cleanly for these stakers rather than bridging, since it
has the same unconditional migrator call. Given every V1 NFT is now locked in
the V2 contract, V1 bridging and V1 staking are both dead paths and are better
removed than repaired.
