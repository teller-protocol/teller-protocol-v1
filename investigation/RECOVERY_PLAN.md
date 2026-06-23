# NFT Attack — Recovery Plan & On-chain Verification

_Generated 2026-06-23 from live mainnet + Polygon RPC. Supersedes the custody assumptions in `bridgeNFTsV1_attack_transactions.csv`._

## 1. What actually happened (verified on-chain)

`bridgeNFTsV1` (mainnet diamond `0xc14D99…`) was exploited on 2026-05-12. For each stolen NFT it:
1. unstaked/pulled a **victim's** staked V1 NFT (`0x2ceB85…`),
2. migrated it into the V2 contract (`0x8f9bbbB0…`), minting the V2 tier token to the diamond,
3. **locked the V2 token in the Polygon PoS ERC1155 predicate** (`0x0b9020d4…`),
4. emitted a StateSync minting the token **to the attacker on Polygon** (`0x7550c40e…`).

The attacker then **bridged everything back to mainnet**:
- Received **316 units / 79 tiers** on Polygon (PolyTellerNFT `0x83AF…80cC`).
- Burned all 316 in one `withdrawBatch` (Polygon tx `0x43b46c4b…`, 2026-05-12 07:05 UTC) → PoS exit released all 316 back to the attacker on **mainnet**.
- Dispersed **284 units to 11 addresses** (0 of which are victims), keeping ~32.

**Nothing is on Polygon** (all burned). All recoverable tokens are on **mainnet**.

## 2. Current custody (the updated "spreadsheet")

Three generated CSVs in `investigation/`:
- `nft_attack_inventory_by_tier_2026-06-23.csv` — 79 tiers, units stolen, known original stakers per tier.
- `nft_attack_ledger_2026-06-23.csv` — per (tier, current holder): received vs held-now.
- `nft_attack_holders_summary_2026-06-23.csv` — per-holder totals.

Key numbers:
- **316** stolen units total.
- Only **190** still traceable at the attacker + 11 first-hop holders; **126** dispersed further (need recursive tracing).
- Main sink: **`0xa56d424c…` holds 133 units** now (consolidation wallet). Attacker holds 32. The two biggest first-hop recipients (96 & 84 units) have **on-sold everything** (now 0) — likely to marketplaces / deeper wallets.
- Original-staker attribution is only **145/316 units (45%)** — the old CSV captured under half the attack.

## 3. Mainnet capability gap — can we even do the return today?

**No, not as-is.** The current mainnet `TellerNFT_V2` implementation (`0x27eF2361…`, which has *diverged* from the repo source) exposes only standard ERC1155 + AccessControl + **`adminBurn`** (ADMIN-gated). It does **NOT** have:
- `adminForceTransfer` / `adminForceTransferBatch` (needed to claw stolen tokens back to stakers),
- `adminMint` (needed to mint replacements),
- `recoverAdmin`.

Also, the **Safe does not currently hold the ADMIN role** on mainnet (`hasRole(ADMIN, Safe)=false`).

**Good news:** the mainnet Safe `0x9E3bfee4…` **owns the mainnet ProxyAdmin** `0x224Aa0f856eB0069130C90b168D8301FC5c06c38`, so the same upgrade-and-recover playbook used for Polygon is fully available on mainnet.

## 4. Recovery plan

**Step 0 — Choose the mechanism (governance decision):**
- (A) **Clawback** the actual stolen tokens via `adminForceTransfer` from current holders → original stakers. Cleanest in principle but touches **third-party holders** (some may be innocent buyers), tokens are **fungible** (return by tier+count, not identity), and ~126 units have moved to deeper/marketplace addresses that may be **unreachable**.
- (B) **Re-mint replacements** to stakers via `adminMint`, leaving the stolen tokens where they are. Doesn't touch third parties, but inflates supply and leaves stolen tokens circulating.
- Likely a **hybrid**: force-transfer from the attacker (32) + the consolidation wallet (133) where clearly attacker-controlled; re-mint for units sold to innocent third parties.

**Step 1 — Complete original-staker attribution.** Replay stake/unstake (`NFTLib.unstake`) + V1 transfer events to attribute all 316 units to stakers (currently 145/316). Required for any mechanism.

**Step 2 — Finish the custody trace.** Recursively follow the 126 deeper-dispersed units; classify each terminal holder as EOA / attacker-controlled / marketplace / exchange. Determines what is realistically recoverable.

**Step 3 — Upgrade the mainnet NFT contract.** Deploy a new `MainnetTellerNFT` implementation adding `adminForceTransfer`, `adminForceTransferBatch`, `recoverAdmin` (hardcoding mainnet ProxyAdmin `0x224Aa0f8…`), and optionally `adminMint`. Mirror the Polygon contract + reuse its tests.

**Step 4 — Re-seat ADMIN to the Safe.** Propose `ProxyAdmin.upgradeAndCall(proxy, newImpl, recoverAdmin(Safe))` via the mainnet Safe (Ledger-signed) — atomic upgrade + ADMIN recovery, no front-run window. (Mirror `tasks/propose-recover-admin-poly-teller-nft.ts`.)

**Step 5 — Build & propose the return transactions.** Group the recovery map by destination staker; emit one `adminForceTransferBatch(from, staker, ids[], amounts[])` per (source, staker); multiSend-bundle into a few Safe proposals; dry-run on a mainnet fork; propose to the Safe.

**Step 6 — Verify** balances post-execution; produce a final reconciliation report.

## Caveats
- ERC1155 tiers are fungible — recovery is by tier + amount, not unique token identity.
- Force-transferring from non-attacker holders is a legal/governance decision, not just technical.
- Tokens that reached marketplaces/exchanges are likely unrecoverable by admin force-transfer.
- The old CSV is CRLF and under-captures the attack (145/316 units); treat the generated 2026-06-23 CSVs as authoritative.

## Status — completed 2026-06-23

**Step 1 (staker attribution) — DONE.** All 316 stolen units were `bridgeNFTsV1` calls; each maps 1:1 to a V1 token and original staker. Tier distribution reconciles exactly with the burn inventory (79 tiers). **174 distinct victims** (the old CSV saw only 82). Artifacts:
- `nft_attack_staker_attribution_2026-06-23.csv` — original_staker → v2_tier → units_owed
- `nft_attack_units_detail_2026-06-23.csv` — per unit: v1_token, v2_tier, staker, attack_tx

**Steps 3–4 (mainnet upgrade + Safe tasks) — DRAFTED.**
- `contracts/nft/mainnet/MainnetTellerNFT.sol` — added `adminMint`, `adminBurn`, `adminBurnBatch`, `adminForceTransfer`, `adminForceTransferBatch`. Compiles. **No `recoverAdmin`** — unnecessary on mainnet (see below).
- `tasks/propose-upgrade-mainnet-teller-nft.ts` (step 1) — deploys new impl + proposes plain `ProxyAdmin.upgrade(proxy, newImpl)` via the 3-of-6 Safe (Ledger).
- `tasks/propose-grant-nft-admin-mainnet.ts` (step 2) — proposes `grantRole(ADMIN, recoverySafe)` from the existing 1-of-1 ADMIN Safe `0x8d8e82…` (Ledger).
- `tasks/nft/return-stolen-nfts.ts` (step 3) — reads a recovery map, validates balances, proposes one `adminForceTransferBatch` per (holder→staker) to the Safe. Dry-run validated against live mainnet.
- `investigation/build_recovery_map.py` — generates `recovery_map.json` + `remint_list.json` from the attribution + current balances (policy knob: which holders are clawback-eligible).

**Why no `recoverAdmin` on mainnet:** unlike Polygon (where ADMIN was stuck on an untrusted key), mainnet ADMIN is held by team-controlled addresses — the deployer EOA `0xafe87013…` and a 1-of-1 Safe `0x8d8e821d…` (co-owned by the 3-of-6 multisig `0x9E3bfee4…`). ADMIN was even re-granted to the deployer at block 25126919 (post-attack), confirming live control. So ADMIN is re-seated with a normal `grantRole`, no proxy-admin backdoor.

**Allocation result** (clawback-eligible = attacker + consolidation wallet `0xa56d424c…`): of 316 owed, **151 units recoverable by force-transfer** (81 Safe txs to 76 stakers); **165 units must be re-minted** (sold to innocent third parties / marketplaces — not clawed back).

**Remaining before execution:** (a) governance sign-off on clawback-eligible set + the re-mint decision; (b) optional deeper trace of the 126 further-dispersed units to expand recoverable set; (c) a mainnet fork test of the upgrade + force-transfer; (d) execute step 4 (ADMIN recovery) before `return-stolen-nfts --send`.

## Key addresses
| Role | Address |
|---|---|
| Attacker | `0x7550c40e188b3da9349c9d7b941a699c2f62e0e3` |
| Mainnet V2 NFT (proxy) | `0x8f9bbbB0282699921372A134b63799a48c7d17FC` |
| Mainnet V2 impl (current) | `0x27eF2361675C3F25eA1F2dFe44d25Af29D2F1aD5` |
| Mainnet ProxyAdmin | `0x224Aa0f856eB0069130C90b168D8301FC5c06c38` |
| Mainnet Safe (owns ProxyAdmin) | `0x9E3bfee4C6b4D28b5113E4786A1D9812eB3D2Db6` |
| PoS ERC1155 predicate | `0x0b9020d4E32990D67559b1317c7BF0C15D6EB88f` |
| Main consolidation wallet | `0xa56d424ceb11d1f3c55e5cc0ab0911f2aa9926f2` (133 units) |
