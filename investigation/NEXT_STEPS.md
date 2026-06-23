# NFT Recovery — Open Items (next steps)

Tracked follow-ups from the recovery build. See `RECOVERY_PLAN.md` for the full
context and `EXECUTION.md` for the step-by-step runbook.

## Open / not yet done

### 1. Mainnet fork test (recommended before any on-chain action)
End-to-end rehearsal on a mainnet fork at current block:
- Deploy the new `MainnetTellerNFT` impl, `ProxyAdmin.upgrade(proxy, impl)`.
- `grantRole(ADMIN, recoverySafe)` from the 1-of-1 ADMIN Safe `0x8d8e82…`
  (impersonate it on the fork).
- Run the `recovery_map.json` force-transfers (impersonate the recovery Safe) and
  assert each staker's post-balance equals units_owed and each holder's stolen
  balance goes to 0.
- Adapt `scripts/verify-recover-admin.ts` (the Polygon local rehearsal) as the model.

### 2. Verify whether the 40 "burned" units are actually recoverable re-bridges
The taint trace counts 40 units sent to `0x0` as burned (→ re-mint). Some may be
`withdrawBatch` re-bridges to Polygon (token still exists on Polygon) rather than
true dead burns. For each of the 40 burn events, check whether a matching Polygon
deposit/mint exists. Any that are re-bridges are clawable on Polygon instead of
re-minted — shrinking the re-mint set below 40.

### 3. Re-mint task for the genuinely-burned units (≤40)
Write `tasks/nft/remint-stolen-nfts.ts` (mirror of `return-stolen-nfts`) that reads
`remint_list.json` and proposes `adminMint(to, id, amount)` calls, MultiSend-bundled.
Consider adding an `adminMintBatch(to, ids[], amounts[])` to `MainnetTellerNFT.sol`
to group per-victim and cut the number of inner calls.

### 4. Governance sign-off (gating, non-technical)
Multisig signers must agree on: the clawback-from-all-holders policy, the re-mint
list, and that they will co-sign each Safe proposal. This is the authorization gate
before `--send` on any step. (Legal awareness re: seizing from downstream holders.)

### 5. Post-recovery cleanup (optional)
After `grantRole(ADMIN, recoverySafe)`, revoke the old ADMIN holders for hygiene:
`revokeRole(ADMIN, 0xafe87013…)` (deployer EOA) and `revokeRole(ADMIN, 0x8d8e82…)`
(1-of-1 Safe), executed from the recovery Safe.

## Done (for reference)
- Staker attribution (316 units → 174 victims) — authoritative, reconciles with burn inventory.
- Full taint ledger of current holders (276 clawback-able / 40 burned).
- `MainnetTellerNFT` upgrade impl (adminMint/Burn/BurnBatch/ForceTransfer/ForceTransferBatch; no recoverAdmin — not needed).
- Tasks: `propose-upgrade-mainnet-teller-nft`, `propose-grant-nft-admin-mainnet`, `return-stolen-nfts` (MultiSend-batched).
- `build_recovery_map.py` → `recovery_map.json` + `remint_list.json`.
