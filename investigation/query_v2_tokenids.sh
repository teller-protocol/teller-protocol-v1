#!/usr/bin/env bash
#
# Resolves V2 token IDs for each V1 token ID in the attack transactions CSV.
# Calls convertV1TokenId() on the MainnetTellerNFT V2 contract for each V1 token ID.
#
# Prerequisites:
#   - foundry (cast) installed
#   - ETH_RPC_URL env var set to a mainnet RPC endpoint
#
# Usage:
#   ETH_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_KEY ./query_v2_tokenids.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CSV_FILE="${SCRIPT_DIR}/bridgeNFTsV1_attack_transactions.csv"
OUTPUT_FILE="${SCRIPT_DIR}/bridgeNFTsV1_attack_transactions_v2.csv"

MAINNET_NFT_V2="0x8f9bbbB0282699921372A134b63799a48c7d17FC"
# Use a historical block before the attack (May 12, 2026) because the current
# implementation was upgraded and lost the _uriHashToId mappings needed by convertV1TokenId.
BLOCK=25077199

if [ -z "${ETH_RPC_URL:-}" ]; then
  echo "ERROR: ETH_RPC_URL environment variable is not set."
  echo "Usage: ETH_RPC_URL=https://... $0"
  exit 1
fi

if ! command -v cast &> /dev/null; then
  echo "ERROR: 'cast' (foundry) is not installed."
  exit 1
fi

# Read header and add token_id_v2 column
HEADER=$(head -1 "$CSV_FILE")
echo "${HEADER},token_id_v2" > "$OUTPUT_FILE"

# Process each data row
TOTAL=$(tail -n +2 "$CSV_FILE" | wc -l)
COUNT=0

tail -n +2 "$CSV_FILE" | while IFS= read -r line; do
  COUNT=$((COUNT + 1))

  # Extract V1 token ID (8th field)
  V1_TOKEN_ID=$(echo "$line" | cut -d',' -f8)

  # Call convertV1TokenId on mainnet at historical block
  RAW=$(cast call "$MAINNET_NFT_V2" \
    "convertV1TokenId(uint256)(uint256)" \
    "$V1_TOKEN_ID" \
    --rpc-url "$ETH_RPC_URL" \
    --block "$BLOCK")
  # Extract just the number (cast may append scientific notation in brackets)
  V2_TOKEN_ID=$(echo "$RAW" | awk '{print $1}')

  echo "[$COUNT/$TOTAL] V1 token $V1_TOKEN_ID -> V2 token $V2_TOKEN_ID"

  echo "${line},${V2_TOKEN_ID}" >> "$OUTPUT_FILE"
done

echo ""
echo "Done! Output written to: $OUTPUT_FILE"
echo "To replace the original CSV:"
echo "  mv $OUTPUT_FILE $CSV_FILE"
