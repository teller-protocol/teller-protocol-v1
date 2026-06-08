# bridgeNFTsV1 Attack Investigation - May 12, 2026

## Attacker EOAs
1. **`0x7550c40e188b3da9349c9d7b941a699c2f62e0e3`** — primary attacker (138 calls, nonces starting at 0 = fresh wallet)
2. **`0x4a9a6a2171244bad773f1b3eb9c07d921f36835f`** — secondary address (3 calls at the start of the attack)

## Target Contract
- **TellerDiamond (Proxy):** `0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C`
- **Vulnerable Facet (OLD):** `0x9b8E7C9C750889df12fab6BD40AF79284FFE4665`
- **Fixed Facet (NEW):** `0x8bae586f7899df13d6bce0831971b82b53af974f`

## Attack Timeline
- **Date:** May 12, 2026
- **Time window:** ~06:19 UTC to ~06:24 UTC (~5 minutes)
- **Block range:** 25077006 to 25077221
- **Total `bridgeNFTsV1` calls:** 141 transactions
- **All transactions succeeded** (isError = 0)

## Vulnerability
The `bridgeNFTsV1` function in `NFTMainnetBridgingToPolygonFacet.sol` had a critical ownership bypass bug.

### Buggy Code (OLD facet)
```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstake(tokenId, msg.sender);
} else if (TELLER_NFT_V1.ownerOf(tokenId) == msg.sender) {
    TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
}
```
The `else if` meant that if the NFT was NOT staked by the caller AND the caller did NOT own the NFT, execution simply **fell through silently** — no revert, no ownership check enforced. The migrator delegatecall and bridge deposit would still execute.

### Fixed Code (NEW facet)
```solidity
if (EnumerableSet.contains(stakedNFTs, tokenId)) {
    NFTLib.unstake(tokenId, msg.sender);
} else {
    require(TELLER_NFT_V1.ownerOf(tokenId) == msg.sender);
    TELLER_NFT_V1.transferFrom(msg.sender, address(this), tokenId);
}
```
The fix changed `else if` to `else` with a `require`, ensuring the function **reverts** if the caller doesn't own the NFT.

## Attack Mechanics
1. Attacker called `bridgeNFTsV1(tokenId)` for NFTs they did NOT own
2. The `if` branch (staked check) was false — attacker had nothing staked
3. The `else if` branch (ownership check) was also false — attacker didn't own the NFTs
4. Execution fell through to the migrator delegatecall and `__depositFor`
5. NFTs were migrated V1->V2 and bridged to Polygon via ROOT_CHAIN_MANAGER, deposited to `msg.sender` (the attacker) on Polygon

## NFTs Affected
141 token IDs ranging from 906 to 1984. See `bridgeNFTsV1_attack_transactions.csv` for the complete list.

## Sample Transactions
| TX Hash | Token ID |
|---------|----------|
| `0x02df4c62...` | 1594 |
| `0x94bb65b3...` | 1595 |
| `0x89f043a8...` | 906 |
| `0x8dbcaef2...` | 929 |
| `0x1873f6a2...` | 1888 |
| `0xb205dbbf...` | 1984 |

## Remediation
- **Fix commit:** `26cf154d` (2026-05-12) - "adding facet upgrade fn"
- **Diamond cut** replaced the old facet with the fixed facet at `0x8bae586f...`
- **Post-upgrade block:** 25094100
- **Test:** `test/unit/nft-bridge-ownership-fix.test.ts` proves the fix works

## Key Contract Addresses
| Contract | Address |
|----------|---------|
| TellerNFT V1 | `0x2ceB85a2402C94305526ab108e7597a102D6C175` |
| MainnetTellerNFT V2 | `0x8f9bbbB0282699921372A134b63799a48c7d17FC` |
| Polygon NFT | `0x83AF2b36A3F8593203b2098CBec616A57f1A80cC` |
| ROOT_CHAIN_MANAGER | `0xA0c68C638235ee32657e8f720a23ceC1bFc77C77` |
| ERC1155_PREDICATE | `0x0B9020d4E32990D67559b1317c7BF0C15D6EB88f` |
