#!/usr/bin/env python3
"""Build the recovery map consumed by the `return-stolen-nfts` Hardhat task.

Inputs (all under investigation/, produced by the on-chain forensic trace):
  - nft_attack_staker_attribution_2026-06-23.csv  (original_staker, v2_tier, units_owed)
  - nft_attack_ledger_2026-06-23.csv              (v2_tier, current_holder, ..., units_held_now)

Policy knob: CLAWBACK_ELIGIBLE — addresses we will force-transfer FROM. Per the
2026-06-23 decision this is None = ALL current holders (downstream buyers who
skipped due diligence are clawed back too). Units we still can't source (sent to
holders not yet traced into the ledger, or burned) become re-mint obligations.

Outputs:
  - recovery_map.json   : [{from,to,ids,amounts}]  -> force-transfers (adminForceTransferBatch)
  - remint_list.json    : [{to,id,amount}]         -> shortfall to re-mint (adminMint)
Both are allocations BY TIER (ERC1155 tiers are fungible); identity within a tier
is not preserved.
"""
import csv, json, os
from collections import defaultdict, deque

HERE = os.path.dirname(os.path.abspath(__file__))
ATTACKER = "0x7550c40e188b3da9349c9d7b941a699c2f62e0e3"
# Policy (2026-06-23): claw back from ALL current holders of stolen units — the
# downstream recipients failed their due diligence buying exploited NFTs and are
# not treated as innocent. Set CLAWBACK_ELIGIBLE = None to use every holder in
# the ledger as a force-transfer source; or pin to a specific set to restrict.
CLAWBACK_ELIGIBLE = None

def load_attribution():
    owed = defaultdict(list)  # tier -> [(staker, units)]
    with open(os.path.join(HERE, "nft_attack_staker_attribution_2026-06-23.csv")) as f:
        for r in csv.DictReader(f):
            owed[int(r["v2_tier"])].append((r["original_staker"], int(r["units_owed"])))
    return owed

def load_recoverable():
    # taint-traced current holders of STOLEN units, by tier (full forward trace —
    # attributes only the stolen portion of each holder's balance, not legit ones).
    pool = defaultdict(lambda: defaultdict(int))  # tier -> {holder: stolen_units}
    with open(os.path.join(HERE, "nft_attack_full_ledger_2026-06-23.csv")) as f:
        for r in csv.DictReader(f):
            h = r["current_holder"].lower()
            if CLAWBACK_ELIGIBLE is not None and h not in CLAWBACK_ELIGIBLE:
                continue
            pool[int(r["v2_tier"])][h] += int(r["stolen_units_held"])
    return pool

def main():
    owed = load_attribution()
    pool = load_recoverable()

    transfers = defaultdict(lambda: defaultdict(int))  # (from,to) -> {tier: amount}
    remint = []  # {to,id,amount}
    total_owed = total_xfer = total_remint = 0

    for tier, claims in owed.items():
        sources = deque(sorted(
            ((h, n) for h, n in pool.get(tier, {}).items() if n > 0),
            key=lambda x: -x[1]))
        src_holder, src_left = (sources.popleft() if sources else (None, 0))
        for staker, need in claims:
            total_owed += need
            while need > 0 and (src_left > 0 or sources):
                if src_left == 0:
                    src_holder, src_left = sources.popleft()
                take = min(need, src_left)
                transfers[(src_holder, staker)][tier] += take
                src_left -= take
                need -= take
                total_xfer += take
            if need > 0:
                remint.append({"to": staker, "id": tier, "amount": need})
                total_remint += need

    recovery_map = [
        {"from": frm, "to": to,
         "ids": [str(t) for t in sorted(tiers)],
         "amounts": [str(tiers[t]) for t in sorted(tiers)]}
        for (frm, to), tiers in transfers.items()
    ]
    json.dump(recovery_map, open(os.path.join(HERE, "recovery_map.json"), "w"), indent=2)
    json.dump(remint, open(os.path.join(HERE, "remint_list.json"), "w"), indent=2)

    print(f"clawback-eligible: {'ALL current holders' if CLAWBACK_ELIGIBLE is None else sorted(CLAWBACK_ELIGIBLE)}")
    print(f"total units owed:        {total_owed}")
    print(f"  -> force-transfer:     {total_xfer}  ({len(recovery_map)} Safe txs / (from,to) pairs)")
    print(f"  -> re-mint (shortfall): {total_remint}  ({len(remint)} adminMint calls)")
    print(f"distinct stakers receiving force-transfers: "
          f"{len({to for (_, to) in transfers})}")
    print("wrote recovery_map.json + remint_list.json")

if __name__ == "__main__":
    main()
