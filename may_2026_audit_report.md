# Teller Protocol v1 — Security Audit Report

**Date:** 2026-05-29
**Branch audited:** `develop` (commit `7bcfac22`)
**Scope:** All 165 Solidity files under `contracts/`
**Focus:** Logic / authorization bugs in the class of the May 12, 2026 `bridgeNFTsV1` exploit — checks that silently pass instead of reverting — plus a general logic-bug sweep and a full initializer audit.

---

## Background — the May 12 exploit (reference)

On 2026-05-12, `bridgeNFTsV1` in `NFTMainnetBridgingToPolygonFacet.sol` was exploited (~141 transactions, ~5 minutes). The root cause was an **ownership check written as a branch condition that silently fell through** instead of reverting:

```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstake(tokenId, msg.sender);
} else if (TELLER_NFT_V1.ownerOf(tokenId) == msg.sender) {   // BUG: no else { revert }
    TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
}
// execution continues even when neither branch ran → bridges an NFT the caller never owned
```

The fix (on `feature/bridge-upgrade` / `investigation/bridge-upgrade`) changes the `else if` to `else { require(owner == msg.sender); ... }`. This report hunts that bug class throughout the codebase.

---

## Summary of findings

| ID | Severity | Title | File |
|----|----------|-------|------|
| C-1 | 🔴 CRITICAL | `initializer` modifier never sets the flag → NFTDistributor ADMIN takeover | `contexts/initializable/modifiers/initializer.sol:7` |
| H-1 | 🟠 HIGH | `bridgeNFTsV1` ownership fall-through **still unpatched on `develop`** | `nft/mainnet/NFTMainnetBridgingToPolygonFacet.sol:100` |
| H-2 | 🟠 HIGH | `bridgeNFTsV2` wrong transfer amount → orphaned staked NFTs (loss of funds) | `nft/mainnet/NFTMainnetBridgingToPolygonFacet.sol:137` |
| H-3 | 🟠 HIGH | Reversed balance check in `callDappWithValue` | `escrow/escrow/LoansEscrow_V1.sol:71` |
| H-4 | 🟠 HIGH | Aave strategy `rebalance` branch direction inverted | `lending/ttoken/strategies/aave/TTokenAaveStrategy_1.sol:87` |
| H-5 | 🟠 HIGH | `YearnFacet` reads wrong account + malformed calldata → always reverts | `escrow/dapps/YearnFacet.sol:68,72,110` |
| H-6 | 🟠 HIGH | Chainlink staleness check loosened + no freshness window | `price-aggregator/pricers/ChainlinkPricer.sol:43` |
| M-1 | 🟡 MEDIUM | `depositCollateral` bitmask guard admits NonExistent & Closed loans | `market/CollateralFacet.sol:40` |
| M-2 | 🟡 MEDIUM | `TellerNFTDictionary.initialize` lacks an `initializer` guard | `nft/TellerNFTDictionary.sol:56` |
| L-1 | 🔵 LOW | `CollateralEscrow_V1.init` has no explicit one-shot guard | `market/collateral/CollateralEscrow_V1.sol` |
| L-2 | 🔵 LOW | Tautological `require(balance >= 0)` (dead guard) | `escrow/dapps/AaveFacet.sol:185` |
| L-3 | 🔵 LOW | `loanNFTsV2Amounts` overwrite (`=` vs `+=`) on duplicate NFT IDs | `nft/libraries/NFTLib.sol:147` |
| I-1 | ⚪ INFO | `PoolTogetherPricer` returns 0 — must never be wired in | `price-aggregator/pricers/PoolTogetherPricer.sol` |

All findings below were confirmed by reading the source directly.

---

## 🔴 CRITICAL

### C-1 — `initializer` modifier never sets `initialized` → NFTDistributor ADMIN takeover

**File:** `contracts/contexts/initializable/modifiers/initializer.sol:7`

```solidity
modifier initializer() {
    require(
        !initializableStorage().initialized,
        "Teller: already initialized"
    );
    _;   // ← never sets initializableStorage().initialized = true
}
```

The modifier reads `initialized` but **nothing in the entire codebase ever writes it** (verified: a grep for assignments to `initialized` returns zero hits). The storage flag (`contexts/initializable/storage.sol`) is therefore always `false`, and the guard is a no-op — every function using this modifier can be called repeatedly by anyone.

**Exploit chain.** The modifier protects `ent_initialize_NFTDistributor_v1.initialize()`, a **live facet of the deployed TellerNFTDistributor diamond** (`deploy/nft.ts:153`):

```solidity
// contracts/nft/distributor/entry/initialize.sol:25
function initialize(address _nft, address admin) external initializer {
    distributorStore().nft = MainnetTellerNFT(_nft);
    _grantRole(ADMIN, admin);   // grants a caller-chosen admin
}
```

Because the flag is never set, an attacker can re-call `initialize(attackerNft, attacker)` post-deployment and obtain `ADMIN`. With `ADMIN`, the attacker calls `addMerkle` / `moveMerkle` (`entry/add-merkle.sol`, `move-merkle.sol`, both `authorized(ADMIN, ...)`) to install an attacker-controlled merkle root, then `claim` (`entry/claim.sol`) to mint arbitrary TellerNFTs — the distributor holds the `MINTER` role on TellerNFT. They can also repoint `distributorStore().nft`. **Full unauthorized mint / protocol takeover of the NFT distributor.**

**Fix.** Set the flag inside the modifier:

```solidity
modifier initializer() {
    require(!initializableStorage().initialized, "Teller: already initialized");
    initializableStorage().initialized = true;
    _;
}
```

(Preferably migrate the distributor to the OpenZeppelin `Initializable` pattern already used elsewhere in the codebase.)

---

## 🟠 HIGH

### H-1 — `bridgeNFTsV1` ownership fall-through is still unpatched on `develop`

**File:** `contracts/nft/mainnet/NFTMainnetBridgingToPolygonFacet.sol:100`

The exact bug from the May 12 exploit is **present in the current `develop` branch**. The fix lives only on `feature/bridge-upgrade` / `investigation/bridge-upgrade` and has not been merged.

```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstake(tokenId, msg.sender);
} else if (TELLER_NFT_V1.ownerOf(tokenId) == msg.sender) {   // silent fall-through
    TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
}
(bool success, bytes memory data) = migrator.delegatecall(
    abi.encodeWithSelector(NFTMigrator.migrateV1toV2.selector, tokenId)
);
require(success, "Teller: Migration unsuccessful");
uint256 tokenIdV2 = abi.decode(data, (uint256));
__depositFor(tokenIdV2, 1);
```

When `tokenId` is neither staked by nor owned by `msg.sender`, both branches are skipped, the function does **not revert**, and it proceeds to `migrateV1toV2` (which moves a V1 NFT already held by the Diamond) and `__depositFor` (which bridges the resulting V2 NFT to `msg.sender` on Polygon). Any diamond-held V1 NFT — e.g. another user's staked NFT — can be bridged to an attacker.

**Fix.** Make non-ownership terminal:

```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstake(tokenId, msg.sender);
} else {
    require(TELLER_NFT_V1.ownerOf(tokenId) == msg.sender, "Teller: not NFT owner");
    TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
}
```

### H-2 — `bridgeNFTsV2` wrong transfer amount → orphaned staked NFTs (loss of funds)

**File:** `contracts/nft/mainnet/NFTMainnetBridgingToPolygonFacet.sol:124-150`

```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    if (amountStaked <= amountToBridge) {
        NFTLib.unstakeV2(tokenId, amountStaked, msg.sender);
    } else {
        NFTLib.unstakeV2(tokenId, amountToBridge, msg.sender);
    }
}
if (amountToBridge > amountStaked && amountToBridge - amountStaked > 0) {
    TELLER_NFT_V2.safeTransferFrom(
        msg.sender, address(this), tokenId,
        amountToBridge,                 // BUG: should be amountToBridge - amountStaked
        ""
    );
}
__depositFor(tokenId, amountToBridge);
```

Two related defects:
1. The wallet transfer pulls `amountToBridge` (the full amount) instead of the un-staked remainder `amountToBridge - amountStaked`.
2. Staked V2 NFTs are custodied by the Diamond; `unstakeV2` only deletes the staked-balance accounting and never returns the underlying tokens for the bridge. The bridge then re-pulls fresh tokens from the wallet.

**Impact** (e.g. `amountStaked = 5`, wallet = 10, `bridgeNFTsV2(tokenId, 10)`): unstakes 5 (accounting cleared, 5 underlying tokens left orphaned in the Diamond with no claim), pulls 10 from the wallet, bridges 10. The user **irrecoverably loses the 5 previously-staked NFTs**. Conversely with `amountStaked = 5`, wallet = 0, `amountToBridge = 10`, the transfer of 10 reverts even though the user legitimately has 5 staked to bridge.

**Fix.**

```solidity
uint256 toUnstake = amountStaked < amountToBridge ? amountStaked : amountToBridge;
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstakeV2(tokenId, toUnstake, msg.sender);
}
if (amountToBridge > toUnstake) {
    TELLER_NFT_V2.safeTransferFrom(
        msg.sender, address(this), tokenId,
        amountToBridge - toUnstake,     // only pull the remainder from the wallet
        ""
    );
}
__depositFor(tokenId, amountToBridge);
```

The already-staked `toUnstake` tokens are already held by the Diamond, so no transfer is needed for them.

### H-3 — Reversed balance check in `callDappWithValue`

**File:** `contracts/escrow/escrow/LoansEscrow_V1.sol:71`

```solidity
function callDappWithValue(address dappAddress, bytes calldata dappData, uint256 amount)
    external payable override onlyOwner returns (bytes memory resData_)
{
    require(
        address(this).balance <= amount,   // BUG: operator reversed
        "Escrow does not have enough balance"
    );
    resData_ = Address.functionCallWithValue(dappAddress, dappData, amount, "Teller: dapp call failed");
}
```

The guard should ensure the escrow holds **at least** `amount` before forwarding it as `msg.value`. As written (`<=`) it passes only when the escrow has *less than or equal to* `amount` and reverts in the normal case, breaking legitimate native-token dapp flows (e.g. `CompoundFacet.compoundLend` cETH minting / WETH re-wrap) while providing no protection.

**Fix:** `require(address(this).balance >= amount, "Escrow does not have enough balance");`

### H-4 — Aave strategy `rebalance` branch direction inverted

**File:** `contracts/lending/ttoken/strategies/aave/TTokenAaveStrategy_1.sol:87`

```solidity
if (storedRatio > aaveStore().balanceRatioMax) {
    ... deposit ...
} else if (storedRatio > aaveStore().balanceRatioMin) {   // BUG: should be <
    _withdraw(0, storedBal, aaveBal);
}
```

The Compound equivalent (`strategies/compound/TTokenCompoundStrategy_1.sol:93`) correctly uses `else if (storedRatio < compoundStore().balanceRatioMin)`, and the documented intent is "withdraw to keep the ratio within range" (withdraw when the ratio falls **below** the minimum). The Aave version fires the withdraw branch when `balanceRatioMin < storedRatio <= balanceRatioMax` — i.e. when the ratio is already inside the healthy band. Inside `_withdraw`, with `amount = 0`, `requiredBal + amount - storedBal` underflows in that region (Solidity 0.8 checked math) and reverts, breaking Aave rebalancing and the `withdraw`/`fundLoan`/`redeem` flows for Aave-backed pools.

**Fix:** change to `else if (storedRatio < aaveStore().balanceRatioMin)`.

### H-5 — `YearnFacet` reads the wrong account + malformed calldata → always reverts

**File:** `contracts/escrow/dapps/YearnFacet.sol:68, 72, 110`

Dapp facets execute in the **Diamond** context and instruct the per-loan escrow to perform the external `call` (`LoansEscrow_V1.callDapp`), so vault shares are minted to the **escrow**. `YearnFacet` nonetheless reads balances at `address(this)` (the Diamond), which holds nothing:

```solidity
uint256 tokenBalanceBeforeDeposit = iVault.balanceOf(address(this));   // Diamond, not escrow
bytes memory callData = abi.encode(IVault.deposit.selector, amount);   // malformed: should be encodeWithSelector
LibDapps.s().loanEscrows[loanID].callDapp(address(iVault), callData);
uint256 tokenBalanceAfterDeposit = iVault.balanceOf(address(this));    // still 0
require(tokenBalanceAfterDeposit > tokenBalanceBeforeDeposit, "YEARN_BALANCE_NOT_INCREASED");  // 0 > 0 → revert
```

Compare with the correct pattern in `CompoundFacet` (`balanceOf(address(LibEscrow.e(loanID)))`). Two bugs compound here:
1. **Wrong account** — every `balanceOf(address(this))` should be `address(LibEscrow.e(loanID))`; the before/after invariant and the `INSUFFICIENT_DEPOSIT`/`require` guards measure the wrong account (and `yearnWithdraw`'s `shares >= balanceOf(...)` is also backwards).
2. **Malformed calldata** — `abi.encode(selector, amount)` ABI-encodes the selector as a full 32-byte word, so the dapp decodes the first argument from the zero padding → `deposit(0)`. Should be `abi.encodeWithSelector(IVault.deposit.selector, amount)`.

Net effect: the Yearn integration always reverts; its safety `require`s are meaningless. **Fix:** use the escrow address for all balance reads, correct the comparison directions, and use `abi.encodeWithSelector`.

### H-6 — Chainlink staleness check loosened + no freshness window

**File:** `contracts/price-aggregator/pricers/ChainlinkPricer.sol:43` (inherited by `PolygonChainlinkPricer`)

```solidity
(uint80 roundID, int256 rawPrice, , uint256 updateTime, uint80 answeredInRound)
    = ChainlinkAgg(...).latestRoundData();
require(rawPrice > 0, "Chainlink price <= 0");
require(updateTime != 0, "Incomplete round");
require(answeredInRound + 2 >= roundID, "Stale price");   // BUG: loosens the check
price_ = SafeCast.toUint256(rawPrice);
```

The canonical staleness check is `answeredInRound >= roundID`. The `+ 2` *loosens* it, explicitly tolerating an answer up to two rounds behind. Worse, there is **no heartbeat/freshness check** on `updateTime` (only `!= 0`), so an arbitrarily old price from a frozen or deprecated feed passes. This price drives collateral-needed math, `isLiquidable`, and liquidation reward payouts, so stale data lets loans evade liquidation or lets liquidators over-extract collateral.

**Fix:**
```solidity
require(answeredInRound >= roundID, "Stale price");
require(block.timestamp - updateTime <= MAX_DELAY, "Stale price");  // per-feed heartbeat bound
```

---

## 🟡 MEDIUM

### M-1 — `depositCollateral` bitmask guard admits NonExistent & Closed loans

**File:** `contracts/market/CollateralFacet.sol:40`

```solidity
uint256 status = uint256(LibLoans.loan(loanID).status);
require(
    status == (uint256(LoanStatus.TermsSet) ^ uint256(LoanStatus.Active)) & status,
    "Teller: loan not active or set"
);
```

With the enum `NonExistent=0, TermsSet=1, Active=2, Closed=3, Liquidated=4`, the expression reduces to `status == (3 & status)`, which is true for status `0, 1, 2, 3` — i.e. it admits **NonExistent(0)** and **Closed(3)** as well as the intended TermsSet/Active. Only Liquidated(4) reverts. Collateral can be deposited into a non-existent or fully-closed loan where it becomes stranded (no borrower-withdraw path runs).

**Fix:** use a direct enum comparison: `require(s == LoanStatus.TermsSet || s == LoanStatus.Active, ...)`.

### M-2 — `TellerNFTDictionary.initialize` lacks an `initializer` guard

**File:** `contracts/nft/TellerNFTDictionary.sol:56`

`initialize` is `public` with no `initializer` modifier and grants `ADMIN` via `_setupRole` *before* calling `__AccessControl_init()`. Re-initialization is currently blocked only because `__AccessControl_init()` (OZ `initializer`) reverts on a second call and rolls back the role grant — a fragile dependency on call ordering. The implementation contract behind the proxy is also left initializable. **Fix:** add an explicit `initializer` modifier / one-shot guard.

---

## 🔵 LOW

- **L-1** — `CollateralEscrow_V1.init` (`market/collateral/CollateralEscrow_V1.sol`) has no explicit one-shot guard; it is protected only transitively because `__Ownable_init`'s OZ `initializer` reverts on a second call. Add an explicit `initializer` for defense-in-depth.
- **L-2** — `escrow/dapps/AaveFacet.sol:185`: `require(aTokenBalanceBeforeWithdraw >= 0, "NO_BALANCE_TO_WITHDRAW")` is tautological for a `uint256` (always true) — dead guard. Use `> 0`.
- **L-3** — `nft/libraries/NFTLib.sol:147`: `s().loanNFTsV2Amounts[loanID][nftID] = amount;` overwrites rather than accumulates. If the same `nftID` appears twice in one `takeOutLoanWithNFTs` call, the first amount is unstaked but overwritten, so restake returns less than was debited and the borrower loses the difference. Dedup the ID list or use `+=`.

---

## ⚪ INFORMATIONAL

- **I-1** — `price-aggregator/pricers/PoolTogetherPricer.sol`: `getRateFor`/`getValueOf` return `0` (marked TODO, not currently used). If ever registered via `setAssetPricer`, any path through it yields zero valuations. Must not be wired into `PriceAggregator` without an implementation.

---

## Initializer audit (full)

Every initializable contract is initialized at deploy time, and the implementation contracts use the OpenZeppelin `Initializable` pattern correctly (with constructor locks). The exceptions are the custom `initializer` modifier (C-1) and the two fragile cases (M-2, L-1).

| Contract | Init fn | Protected? | Initialized at | Notes |
|----------|---------|-----------|----------------|-------|
| `ent_initialize_NFTDistributor_v1` | `initialize` | **NO — C-1** | `deploy/nft.ts:153` | Custom `initializer` never sets the flag → re-callable → ADMIN takeover |
| `TToken_V1` / `TToken_V3` | `initialize` | YES (OZ `initializer` + `constructor() initializer{}`) | `LendingFacet.initLendingPool` (atomic clone) | Clean |
| `TTokenAaveStrategy_1` / `TTokenCompoundStrategy_1` | `init` | OK by design (reachable only via ADMIN-gated `setStrategy` delegatecall) | `setStrategy` | No one-shot guard; writes caller storage — see also H-4 |
| `LoansEscrow_V1` | `init` | YES (`require(owner == address(0))`) | `LibCreateLoan` (atomic) | Clean |
| `CollateralEscrow_V1` | `init` | Transitive only — **L-1** | `LibCollateral` (atomic) | Add explicit `initializer` |
| `TellerNFT` / `TellerNFT_V2` / `MainnetTellerNFT` / `PolyTellerNFT` | `initialize` / `__*_init` | YES (OZ `initializer`) | `deploy/nft.ts` | Clean |
| `TellerNFTDictionary` | `initialize` | **WEAK — M-2** | dictionary deploy | `public`, no modifier; fragile ordering |
| `PriceAggregator` | `initialize` | YES (OZ `initializer` + `require(msg.sender == DEPLOYER)`) | `deploy/price-agg.ts` | Strongest pattern |
| `SettingsFacet` | `init` / `init2` | YES (`if (s.initialized) return; s.initialized = true;`) | `deploy/protocol.ts` (atomic, owner-gated) | Clean |
| `NFTMainnetBridgingToPolygonFacet` | `initNFTBridge` | Permissionless but idempotent/benign | `deploy/protocol.ts` | Only re-approves the canonical predicate |
| `InitializeableBeaconProxy` | `initialize` | YES (`require(_beacon() == address(0))` + constructor pre-init) | `UpgradeableBeaconFactory.cloneProxy` (atomic) | Clean |

---

## Areas reviewed and found clean

- **Access-control core** (`contexts/**`, `contexts2/**`): `authorized`, `onlyOwner`, `entry`, `nonReentry`, `RolesMods.authorized`, `_requireAuthorization`, `_isAdminForRole`, `_hasRole` all use enforced `require`s — no silent fall-through; `grantRole`/`revokeRole` admin gating and role constants are consistent.
- **Diamond infra** (`LibDiamond`, `DiamondCutFacet`, `OwnershipFacet`): cut/ownership correctly owner-gated; storage slots distinct (no collision); `delegatecall` in `initializeDiamondCut` is owner-gated.
- **Loan lifecycle** (`RepayFacet`, `MainnetRepayFacet`, `CreateLoanConsensusFacet`, `LibConsensus`, `LibLoans`, `LibCreateLoan`, `SignersFacet`): state-machine guards, borrower checks, signature/nonce/expiry/dup-signer checks are all enforced `require`s; `payOutLiquidator` re-asserts `LoanStatus.Liquidated`.
- **Lending** (`TToken_V1/V2/V3`, `LendingFacet`, `LendingLib`): `CONTROLLER`/`ADMIN` modifiers present; mint/redeem `nonReentry` + balance requires correct; `+1` rounding in `redeemUnderlying` rounds in the pool's favor (intentional).
- **Escrow dapps** (`CompoundFacet`, `CompoundClaimComp`, `PoolTogetherFacet`, `UniswapFacet`, `SushiswapFacet`, `EscrowClaimTokens`, `DappMods`): `onlyBorrower`/`onlySecured` are enforced `require`s; swap path validation present; `EscrowClaimTokens.claimTokens` correctly `require`s borrower + `LoanStatus.Closed`.
- **NFT** (`NFTFacet`, `MainnetNFTFacet`, `MainnetTellerNFT`, `NFTMigrator`, `TellerNFT*`, `PolyTellerNFT`, `distributor/*`): role-gated mints; `onERC1155Received`/`onERC721Received` validate `msg.sender`; distributor `claim` is permissionless-by-design but cryptographically bound via merkle proof + `_setClaimed`.
- **Settings / pausable / asset** (`SettingsFacet`, `PlatformSettingsFacet`, `PausableFacet`, `AssetSettingsFacet`): privileged setters carry `authorized(ADMIN/PAUSER, ...)`.
- **Other pricers** (`AavePricer`, `CompoundPricer`, `AbstractChainlinkPricer` plumbing): no fall-through auth branches.

---

## Recommended remediation order

1. **C-1** — fix the `initializer` modifier (CRITICAL, live on `develop`).
2. **H-1** — merge the `bridgeNFTsV1` ownership fix into `develop` (still exploitable there).
3. **H-2 / H-3 / H-4 / H-5 / H-6** — fund-movement and oracle correctness bugs.
4. **M-1 / M-2**, then the LOW/INFO items.
