#!/usr/bin/env bash
#
# Prints the three on-chain transactions required to execute the
# EscrowRecoveryFacet remediation, in a form that can be signed
# externally — Frame + Ledger, MetaMask + hardware wallet, or imported
# into a Safe Transaction Builder batch.
#
# No private keys are ever read or required by this script. It only
# emits calldata; signing happens in your wallet of choice.
#
# Usage:
#   bash scripts/print-recovery-txs.sh
#       → prints TX 1 (facet deploy) and instructions for TX 2 / TX 3
#
#   FACET_ADDR=0x<deployed addr> bash scripts/print-recovery-txs.sh
#       → also prints TX 2 (diamondCut) and TX 3 (adminClearV1NFTs)
#
# Each TX block lists:
#   to:    target contract (empty = contract creation)
#   value: 0 ETH
#   data:  signable calldata
#
# Run order:
#   1. Sign TX 1 from the diamond owner key. After it confirms, note
#      the new contract address.
#   2. Re-run with FACET_ADDR=<that address>.
#   3. Sign TX 2 from the diamond owner.
#   4. Sign TX 3 from the ADMIN key (same address as the diamond owner
#      in this deployment: 0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5).

set -euo pipefail

TELLER_DIAMOND="0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C"
DIAMOND_OWNER="0xAFe87013dc96edE1E116a288D80FcaA0eFFE5fe5"
FACET_ARTIFACT="artifacts/contracts/market/EscrowRecoveryFacet.sol/EscrowRecoveryFacet.json"

# All 23 loans with dangling V1 NFT references that block liquidation,
# per the proposal document. Cleared in a single call.
LOAN_IDS=(16 35 44 68 129 159 165 176 185 194 243 284 292 299 309 315 317 322 326 344 409 414 442)

if ! command -v cast >/dev/null 2>&1; then
  echo "ERROR: foundry's 'cast' must be on PATH (https://book.getfoundry.sh/getting-started/installation)"
  exit 1
fi
[ -f "$FACET_ARTIFACT" ] || { echo "ERROR: facet artifact missing — run 'yarn compile' first"; exit 1; }

FACET_BYTECODE=$(jq -r .bytecode "$FACET_ARTIFACT")
SEL_CLEAR=$(cast sig "adminClearV1NFTs(uint256[])")
SEL_VIEW=$(cast sig "getLoanV1NFTs(uint256)")

hr() { printf "─%.0s" {1..63}; echo; }

# -------- TX 1: deploy facet -------------------------------------------------
hr
echo "TX 1 — Deploy EscrowRecoveryFacet"
hr
echo "  signer: any funded EOA (e.g. the diamond owner)"
echo "  to:     (contract creation — leave empty)"
echo "  value:  0"
echo "  data:   ${FACET_BYTECODE}"
echo

if [ -z "${FACET_ADDR:-}" ]; then
  cat <<EOF
After TX 1 confirms, note the deployed contract address and re-run:

  FACET_ADDR=0x<deployed_address> bash scripts/print-recovery-txs.sh

to see the calldata for TX 2 and TX 3.
EOF
  exit 0
fi

# -------- TX 2: diamondCut ---------------------------------------------------
CUT_DATA=$(cast calldata \
  "diamondCut((address,uint8,bytes4[])[],address,bytes)" \
  "[(${FACET_ADDR},0,[${SEL_CLEAR},${SEL_VIEW}])]" \
  "0x0000000000000000000000000000000000000000" \
  "0x")

hr
echo "TX 2 — diamondCut: wire EscrowRecoveryFacet selectors into the Diamond"
hr
echo "  signer: diamond owner (${DIAMOND_OWNER})"
echo "  to:     ${TELLER_DIAMOND}"
echo "  value:  0"
echo "  data:   ${CUT_DATA}"
echo
echo "  what it does:"
echo "    Adds selectors ${SEL_CLEAR} (adminClearV1NFTs) and ${SEL_VIEW}"
echo "    (getLoanV1NFTs) to the diamond, routing them to ${FACET_ADDR}."
echo

# -------- TX 3: adminClearV1NFTs --------------------------------------------
LOAN_LIST=$(IFS=,; echo "${LOAN_IDS[*]}")
CLEAR_DATA=$(cast calldata \
  "adminClearV1NFTs(uint256[])" \
  "[${LOAN_LIST}]")

hr
echo "TX 3 — adminClearV1NFTs for ${#LOAN_IDS[@]} blocked loans"
hr
echo "  signer: ADMIN (${DIAMOND_OWNER})"
echo "  to:     ${TELLER_DIAMOND}"
echo "  value:  0"
echo "  data:   ${CLEAR_DATA}"
echo
echo "  loan IDs cleared in this call:"
echo "    ${LOAN_IDS[*]}"
echo
echo "  what it does:"
echo "    Removes the dangling V1 ERC721 NFT references from each listed"
echo "    loan's storage. After this, any capitalised liquidator can call"
echo "    liquidateLoan(<id>) and the existing flow will repay the"
echo "    lending pool and pay out the standard liquidator reward."
echo

hr
echo "All three transactions are ready. None require touching a private"
echo "key file. Suggested signing flow:"
hr
echo "  • Frame.sh + Ledger:  paste each (to, value, data) into Frame's"
echo "    send dialog, confirm on hardware."
echo "  • Safe Transaction Builder:  copy each tx into a Safe batch and"
echo "    submit through the standard Safe approval flow (requires the"
echo "    diamond owner to first be a Safe — see governance gates)."
echo "  • Etherscan + WalletConnect:  Diamond contract → Write → Custom,"
echo "    paste the raw 'data' field, connect hardware wallet, sign."
