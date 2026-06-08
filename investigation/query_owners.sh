#!/bin/bash
export FOUNDRY_DISABLE_NIGHTLY_WARNING=1
RPC="https://eth-mainnet.g.alchemy.com/v2/ProfTpz_VAWEWlG06CntZ"
NFT="0x2ceB85a2402C94305526ab108e7597a102D6C175"
TRANSFER_SIG="0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
DIAMOND_TOPIC="0x000000000000000000000000c14d994fe7c5858c93936cc3bd42bb9467d6fb2c"
ATTACKER="0x7550c40e188b3da9349c9d7b941a699c2f62e0e3"

echo "token_id,old_owner,new_owner"

tail -n +2 /home/andy/teller/teller-protocol-v1/investigation/bridgeNFTsV1_attack_transactions.csv | while IFS=, read -r tx_hash from_addr to_addr block_num timestamp date_utc function token_id is_error; do
    TOKEN_HEX=$(printf "0x%064x" "$token_id")

    # Get Transfer events to Diamond for this token
    raw=$(cast logs --from-block 0 --to-block 25077199 --address "$NFT" "$TRANSFER_SIG" "" "$DIAMOND_TOPIC" "$TOKEN_HEX" --rpc-url "$RPC" 2>/dev/null)

    # Extract the from address from the first topic line after "topics: ["
    # The topics array has: [event_sig, from, to, tokenId]
    # We want the 'from' which is the second topic
    old_owner=$(echo "$raw" | grep -oP '0x0{24}[0-9a-fA-F]{40}' | head -1 | sed 's/0x0\{24\}/0x/')

    if [ -z "$old_owner" ]; then
        old_owner="UNKNOWN"
    fi

    echo "${token_id},${old_owner},${ATTACKER}"

    sleep 0.25
done
