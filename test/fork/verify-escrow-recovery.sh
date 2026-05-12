#!/usr/bin/env bash
#
# End-to-end verification of the EscrowRecoveryFacet remediation using a
# Foundry anvil mainnet fork.
#
# Hardhat 2.6 (which this repo uses) cannot fork modern mainnet — its block
# decoder and pending-block path predate the Merge and break on chain state
# returned by current providers. Foundry's anvil handles modern mainnet
# state correctly, so we drive the whole flow from a bash script using
# `cast`. The facet bytecode comes from the existing Hardhat artifact, so
# you only need foundry installed, not a forge project layout.
#
# Prerequisites:
#   - foundry installed (curl -L https://foundry.paradigm.xyz | bash && foundryup)
#   - .env with ALCHEMY_MAINNET_KEY=https://eth-mainnet.g.alchemy.com/v2/<key>
#   - yarn compile previously run so artifacts/ exists
#
# Run:
#   bash test/fork/verify-escrow-recovery.sh

set -euo pipefail

# ---- config ----------------------------------------------------------------

FORK_BLOCK="${FORK_BLOCK:-15000000}"   # pre-Merge, post-V1-NFT-migration
RPC_URL="http://127.0.0.1:8545"
TARGET_LOAN_ID=16

TELLER_DIAMOND="0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C"
DAI="0x6B175474E89094C44Da98b954EedeAC495271d0F"
ADMIN="0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5"
# cDAI holds the underlying DAI for all Compound depositors — a reliable whale.
DAI_WHALE="0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643"

FACET_ARTIFACT="artifacts/contracts/market/EscrowRecoveryFacet.sol/EscrowRecoveryFacet.json"

# Loan status enum: NonExistent=0, TermsSet=1, Active=2, Closed=3, Liquidated=4
LOAN_STATUS_ACTIVE=2
LOAN_STATUS_LIQUIDATED=4

# ---- bootstrap -------------------------------------------------------------

if ! command -v anvil >/dev/null 2>&1 || ! command -v cast >/dev/null 2>&1; then
  echo "ERROR: foundry not on PATH. Install with:"
  echo "  curl -L https://foundry.paradigm.xyz | bash && foundryup"
  exit 1
fi

if [ ! -f .env ]; then
  echo "ERROR: .env missing. Copy .env.template and set ALCHEMY_MAINNET_KEY."
  exit 1
fi
# shellcheck disable=SC1091
set -a; source .env; set +a

if [ -z "${ALCHEMY_MAINNET_KEY:-}" ] || [[ "$ALCHEMY_MAINNET_KEY" == add-your-* ]]; then
  echo "ERROR: ALCHEMY_MAINNET_KEY not set in .env"
  exit 1
fi

if [ ! -f "$FACET_ARTIFACT" ]; then
  echo "ERROR: facet artifact missing. Run 'yarn compile' first."
  exit 1
fi

FACET_BYTECODE=$(jq -r .bytecode "$FACET_ARTIFACT")

# ---- helpers ---------------------------------------------------------------

step()    { printf "\n\033[1;36m▸ %s\033[0m\n" "$*"; }
pass()    { printf "  \033[32m✓\033[0m %s\n" "$*"; }
fail()    { printf "  \033[31m✗\033[0m %s\n" "$*"; exit 1; }
expect_eq() {
  if [ "$1" = "$2" ]; then pass "$3 ($1)"; else fail "$3 — expected $2, got $1"; fi
}

cleanup() {
  if [ -n "${ANVIL_PID:-}" ] && kill -0 "$ANVIL_PID" 2>/dev/null; then
    kill "$ANVIL_PID" 2>/dev/null || true
    wait "$ANVIL_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT

# ---- start anvil -----------------------------------------------------------

step "Starting anvil fork @ block $FORK_BLOCK"
anvil \
  --fork-url "$ALCHEMY_MAINNET_KEY" \
  --fork-block-number "$FORK_BLOCK" \
  --port 8545 \
  --silent &
ANVIL_PID=$!

# Wait for anvil to be ready
for _ in $(seq 1 30); do
  if cast block-number --rpc-url "$RPC_URL" >/dev/null 2>&1; then
    pass "anvil ready (pid $ANVIL_PID)"
    break
  fi
  sleep 0.5
done
cast block-number --rpc-url "$RPC_URL" >/dev/null || fail "anvil did not start"

# ---- preconditions ---------------------------------------------------------

step "Preconditions on the deployed Diamond"

LOAN_RAW=$(cast call "$TELLER_DIAMOND" \
  "getLoan(uint256)(address,address,address,uint256,uint128,uint32,uint32,uint16,uint16,uint8)" \
  "$TARGET_LOAN_ID" --rpc-url "$RPC_URL")
LOAN_STATUS=$(echo "$LOAN_RAW" | tail -n 1)
LENDING_TOKEN=$(echo "$LOAN_RAW" | sed -n '2p')
expect_eq "$LOAN_STATUS" "$LOAN_STATUS_ACTIVE" "loan $TARGET_LOAN_ID is Active"
expect_eq "$(echo "$LENDING_TOKEN" | tr 'A-Z' 'a-z')" "$(echo "$DAI" | tr 'A-Z' 'a-z')" \
  "loan $TARGET_LOAN_ID lendingToken == DAI"

# Confirm liquidateLoan currently reverts (the bug)
if cast call "$TELLER_DIAMOND" "liquidateLoan(uint256)" "$TARGET_LOAN_ID" \
     --rpc-url "$RPC_URL" >/dev/null 2>&1; then
  fail "liquidateLoan unexpectedly did NOT revert pre-cut"
else
  pass "liquidateLoan reverts pre-cut (the bug is reachable)"
fi

# Confirm getLoanV1NFTs selector is not on chain yet
if cast call "$TELLER_DIAMOND" "getLoanV1NFTs(uint256)(uint256[])" "$TARGET_LOAN_ID" \
     --rpc-url "$RPC_URL" >/dev/null 2>&1; then
  fail "getLoanV1NFTs unexpectedly exists pre-cut"
else
  pass "getLoanV1NFTs not yet wired (facet hasn't been cut)"
fi

# ---- apply remediation -----------------------------------------------------

step "Deploying EscrowRecoveryFacet"

# Use anvil's first prefunded account (signer 0) as the deployer.
DEPLOYER=$(cast rpc eth_accounts --rpc-url "$RPC_URL" | jq -r '.[0]')
DEPLOY_TX_JSON=$(cast send --rpc-url "$RPC_URL" --from "$DEPLOYER" \
  --unlocked --create "$FACET_BYTECODE" --json)
FACET_ADDR=$(echo "$DEPLOY_TX_JSON" | jq -r .contractAddress)
[ -n "$FACET_ADDR" ] && [ "$FACET_ADDR" != "null" ] || fail "facet deploy failed"
pass "facet deployed at $FACET_ADDR"

step "Cutting facet into the Diamond"

DIAMOND_OWNER=$(cast call "$TELLER_DIAMOND" "owner()(address)" --rpc-url "$RPC_URL")
pass "diamond owner = $DIAMOND_OWNER"

# Fund + impersonate the owner
cast rpc anvil_setBalance "$DIAMOND_OWNER" 0x100000000000000000 --rpc-url "$RPC_URL" >/dev/null
cast rpc anvil_impersonateAccount "$DIAMOND_OWNER" --rpc-url "$RPC_URL" >/dev/null

SEL_CLEAR=$(cast sig "adminClearV1NFTs(uint256[])")
SEL_VIEW=$(cast sig "getLoanV1NFTs(uint256)")
pass "selectors: clear=$SEL_CLEAR view=$SEL_VIEW"

# Sanity: selectors not yet wired
for sel in "$SEL_CLEAR" "$SEL_VIEW"; do
  current=$(cast call "$TELLER_DIAMOND" "facetAddress(bytes4)(address)" "$sel" --rpc-url "$RPC_URL")
  expect_eq "$(echo "$current" | tr 'A-Z' 'a-z')" "0x0000000000000000000000000000000000000000" \
    "$sel not yet wired"
done

cast send "$TELLER_DIAMOND" \
  "diamondCut((address,uint8,bytes4[])[],address,bytes)" \
  "[($FACET_ADDR,0,[$SEL_CLEAR,$SEL_VIEW])]" \
  "0x0000000000000000000000000000000000000000" \
  "0x" \
  --from "$DIAMOND_OWNER" --unlocked --rpc-url "$RPC_URL" >/dev/null
pass "diamondCut succeeded"

for sel in "$SEL_CLEAR" "$SEL_VIEW"; do
  current=$(cast call "$TELLER_DIAMOND" "facetAddress(bytes4)(address)" "$sel" --rpc-url "$RPC_URL")
  expect_eq "$(echo "$current" | tr 'A-Z' 'a-z')" "$(echo "$FACET_ADDR" | tr 'A-Z' 'a-z')" \
    "$sel now points at facet"
done

cast rpc anvil_stopImpersonatingAccount "$DIAMOND_OWNER" --rpc-url "$RPC_URL" >/dev/null

# ---- read V1 NFT references before clearing --------------------------------

step "Verifying V1 NFT references exist on loan $TARGET_LOAN_ID"

V1_BEFORE=$(cast call "$TELLER_DIAMOND" "getLoanV1NFTs(uint256)(uint256[])" "$TARGET_LOAN_ID" \
  --rpc-url "$RPC_URL")
V1_COUNT_BEFORE=$(echo "$V1_BEFORE" | grep -o '0x[0-9a-fA-F]\+' | wc -l)
[ "$V1_COUNT_BEFORE" -gt 0 ] || fail "loan $TARGET_LOAN_ID has no V1 NFT refs (test target invalid at this block)"
pass "loan $TARGET_LOAN_ID has $V1_COUNT_BEFORE V1 NFT reference(s)"

# ---- admin clears the references -------------------------------------------

step "ADMIN clears V1 NFT references"

cast rpc anvil_setBalance "$ADMIN" 0x100000000000000000 --rpc-url "$RPC_URL" >/dev/null
cast rpc anvil_impersonateAccount "$ADMIN" --rpc-url "$RPC_URL" >/dev/null

# Sanity: ADMIN actually has the ADMIN role on chain
ADMIN_ROLE=$(cast keccak "ADMIN")
HAS_ROLE=$(cast call "$TELLER_DIAMOND" "hasRole(bytes32,address)(bool)" \
  "$ADMIN_ROLE" "$ADMIN" --rpc-url "$RPC_URL")
expect_eq "$HAS_ROLE" "true" "$ADMIN holds ADMIN role"

cast send "$TELLER_DIAMOND" "adminClearV1NFTs(uint256[])" "[$TARGET_LOAN_ID]" \
  --from "$ADMIN" --unlocked --rpc-url "$RPC_URL" >/dev/null
pass "adminClearV1NFTs([$TARGET_LOAN_ID]) succeeded"

V1_AFTER=$(cast call "$TELLER_DIAMOND" "getLoanV1NFTs(uint256)(uint256[])" "$TARGET_LOAN_ID" \
  --rpc-url "$RPC_URL")
V1_COUNT_AFTER=$(echo "$V1_AFTER" | grep -o '0x[0-9a-fA-F]\+' | wc -l)
expect_eq "$V1_COUNT_AFTER" "0" "V1 NFT references now cleared"

cast rpc anvil_stopImpersonatingAccount "$ADMIN" --rpc-url "$RPC_URL" >/dev/null

# ---- non-admin rejection ---------------------------------------------------

step "Non-admin cannot call adminClearV1NFTs"

STRANGER=$(cast rpc eth_accounts --rpc-url "$RPC_URL" | jq -r '.[1]')
if cast send "$TELLER_DIAMOND" "adminClearV1NFTs(uint256[])" "[999]" \
     --from "$STRANGER" --unlocked --rpc-url "$RPC_URL" >/dev/null 2>&1; then
  fail "non-admin call did not revert"
fi
pass "non-admin call reverts (as expected)"

# ---- the actual point: liquidation now succeeds ----------------------------

step "Liquidating loan $TARGET_LOAN_ID with a funded liquidator"

LIQUIDATOR=$(cast rpc eth_accounts --rpc-url "$RPC_URL" | jq -r '.[2]')
DEBT_RAW=$(cast call "$TELLER_DIAMOND" "getDebtOwed(uint256)(uint256,uint256)" \
  "$TARGET_LOAN_ID" --rpc-url "$RPC_URL")
PRINCIPAL=$(echo "$DEBT_RAW" | sed -n '1p')
INTEREST=$(echo "$DEBT_RAW" | sed -n '2p')
OWED=$(python3 -c "print(int('${PRINCIPAL%% *}') + int('${INTEREST%% *}'))")
pass "loan owes $OWED wei DAI"

# Whale (cDAI) sends DAI to liquidator
cast rpc anvil_setBalance "$DAI_WHALE" 0x100000000000000000 --rpc-url "$RPC_URL" >/dev/null
cast rpc anvil_impersonateAccount "$DAI_WHALE" --rpc-url "$RPC_URL" >/dev/null
cast send "$DAI" "transfer(address,uint256)" "$LIQUIDATOR" "$OWED" \
  --from "$DAI_WHALE" --unlocked --rpc-url "$RPC_URL" >/dev/null
cast rpc anvil_stopImpersonatingAccount "$DAI_WHALE" --rpc-url "$RPC_URL" >/dev/null

LIQ_BAL=$(cast call "$DAI" "balanceOf(address)(uint256)" "$LIQUIDATOR" --rpc-url "$RPC_URL" \
  | awk '{print $1}')
[ "$LIQ_BAL" = "$OWED" ] || fail "liquidator DAI balance $LIQ_BAL != owed $OWED"
pass "liquidator funded with $OWED DAI"

cast send "$DAI" "approve(address,uint256)" "$TELLER_DIAMOND" "$OWED" \
  --from "$LIQUIDATOR" --unlocked --rpc-url "$RPC_URL" >/dev/null

cast send "$TELLER_DIAMOND" "liquidateLoan(uint256)" "$TARGET_LOAN_ID" \
  --from "$LIQUIDATOR" --unlocked --rpc-url "$RPC_URL" >/dev/null
pass "liquidateLoan($TARGET_LOAN_ID) succeeded post-cut"

LOAN_AFTER=$(cast call "$TELLER_DIAMOND" \
  "getLoan(uint256)(address,address,address,uint256,uint128,uint32,uint32,uint16,uint16,uint8)" \
  "$TARGET_LOAN_ID" --rpc-url "$RPC_URL")
LOAN_STATUS_AFTER=$(echo "$LOAN_AFTER" | tail -n 1)
expect_eq "$LOAN_STATUS_AFTER" "$LOAN_STATUS_LIQUIDATED" "loan $TARGET_LOAN_ID status = Liquidated"

DEBT_AFTER=$(cast call "$TELLER_DIAMOND" "getDebtOwed(uint256)(uint256,uint256)" \
  "$TARGET_LOAN_ID" --rpc-url "$RPC_URL")
PRINCIPAL_AFTER=$(echo "$DEBT_AFTER" | sed -n '1p' | awk '{print $1}')
INTEREST_AFTER=$(echo "$DEBT_AFTER" | sed -n '2p' | awk '{print $1}')
expect_eq "$PRINCIPAL_AFTER" "0" "principalOwed == 0 after liquidation"
expect_eq "$INTEREST_AFTER" "0" "interestOwed == 0 after liquidation"

step "All checks passed."
