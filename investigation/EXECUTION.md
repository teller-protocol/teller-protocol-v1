# Mainnet NFT Recovery — Execution Runbook

Order: **fork test → upgrade → grant ADMIN → return (claw back) → re-mint → cleanup.**
Every `--send` step proposes to a Gnosis Safe and must then be **signed + executed
by that Safe's owners** in the Safe UI. Nothing is irreversible until signers execute.

## Prerequisites
- `.env` has `MAINNET_RPC_URL`, `DEPLOYER_PRIVATE_KEY` (deploys the impl + pays gas),
  `SAFE_GLOBAL_API_KEY` (proposing to Safe).
- A **Ledger** connected, unlocked, Ethereum app open, "blind signing" enabled.
- The Ledger account must be an **owner of the Safe each step targets** (see per-step notes).

## Key addresses
| What | Address | Threshold |
|---|---|---|
| NFT proxy (MainnetTellerNFT / TellerNFT_V2) | `0x8f9bbbB0282699921372A134b63799a48c7d17FC` | — |
| ProxyAdmin | `0x224Aa0f856eB0069130C90b168D8301FC5c06c38` | — |
| **Recovery Safe** (owns ProxyAdmin; gets ADMIN) | `0x9E3bfee4C6b4D28b5113E4786A1D9812eB3D2Db6` | 3-of-6 |
| **ADMIN-holder Safe** (current ADMIN; sources grant) | `0x8d8e821d918204d0f2101f01eef0438d05e14ff8` | 1-of-1 (EOA owner `0x67d42e36…`) |

---

## Step 0 — Fork test (rehearsal, no real funds)
Prove the whole chain works on a mainnet fork before touching mainnet. See
`NEXT_STEPS.md#1`. Do not proceed until this passes.

## Step 1 — Propose the implementation upgrade
Deploys the new `MainnetTellerNFT` impl (adminForceTransfer/adminMint/…) and proposes
`ProxyAdmin.upgrade(proxy, newImpl)` to the **recovery Safe** (it owns ProxyAdmin).

```
yarn hardhat propose-upgrade-mainnet-teller-nft --network mainnet
```
- Gas/deploy: `DEPLOYER_PRIVATE_KEY` EOA. Proposal signer: a **recovery-Safe owner** (one of the 6).
- The task guards that the Safe owns the ProxyAdmin and that the new impl differs from the current one; it prints the new impl address — **record it**.
- **Then:** in the Safe UI, collect 3-of-6 signatures and **execute**. Verify afterward:
  `cast call 0x224Aa0f8… "getProxyImplementation(address)(address)" 0x8f9bbbB0…` returns the new impl.

## Step 2 — Grant ADMIN to the recovery Safe
Proposes `MainnetTellerNFT.grantRole(ADMIN, recoverySafe)` from the current ADMIN-holder Safe.

```
yarn hardhat propose-grant-nft-admin-mainnet --network mainnet
```
- Targets the **1-of-1 ADMIN Safe `0x8d8e82…`**; proposal signer must be **its** owner (the EOA `0x67d42e36…`, threshold 1).
- The task guards that the source Safe currently holds ADMIN.
- **Then:** sign + execute (1 signature). Verify:
  `cast call 0x8f9bbbB0… "hasRole(bytes32,address)(bool)" 0xdf8b4c52…6135ec42 0x9E3bfee4…` → `true`.

## Step 3 — Dry-run the claw-back (no proposal)
```
yarn hardhat return-stolen-nfts --network mainnet --map investigation/recovery_map.json
```
- Must show **"Safe … holds ADMIN: true"** (confirms Step 2) and **"All holders have sufficient balance."**
- Prints how many MultiSend Safe txs the `--send` run would create.
- If balances changed since the trace, regenerate the map first: `python3 investigation/build_recovery_map.py`.

## Step 4 — Propose the claw-back (MultiSend-batched)
```
yarn hardhat return-stolen-nfts --network mainnet --map investigation/recovery_map.json --send --batch 30
```
- ~190 force-transfers → ~7 MultiSend Safe txs (use `--batch 50` for ~4). Proposed to the **recovery Safe**; signer = a recovery-Safe owner.
- **Then:** sign + execute each batch (3-of-6) in the Safe UI, in nonce order. Each batch runs `adminForceTransferBatch` for many (holder→staker) pairs in one tx.

## Step 5 — Re-mint the burned units (≤40)
Only the genuinely-burned units (see `NEXT_STEPS.md#2`–3). After building the re-mint task:
```
yarn hardhat remint-stolen-nfts --network mainnet --map investigation/remint_list.json --send
```
Proposed to the recovery Safe (now ADMIN); sign + execute.

## Step 6 — Cleanup (optional, recommended)
From the recovery Safe, `revokeRole(ADMIN, …)` the old holders (`0xafe87013…`, `0x8d8e82…`)
so ADMIN lives only on the 3-of-6 multisig.

---

## Rollback / safety notes
- Steps 1–4 are **proposals**; they do nothing until the Safe executes. You can delete a
  queued proposal in the Safe UI before execution.
- The upgrade is reversible (upgrade back to the old impl) and adds functions only — it
  does not alter storage layout.
- `adminForceTransfer` only moves the **stolen** portion per the taint trace; legit holdings
  of the same tiers are not touched.
