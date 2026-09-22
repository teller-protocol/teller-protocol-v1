import fs from 'fs'
import path from 'path'
import { task, types } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

/**
 * Reconstructs, from chain state alone, which stakers still hold a
 * `stakedNFTs` (V1) record that the diamond can no longer honour, and how many
 * V2 tokens must be minted to the diamond before those records can be settled.
 *
 * Background: `bridgeNFTsV1` used to fall through silently when the caller
 * neither had the NFT staked nor owned it, migrating another staker's
 * custodied V1 NFT and bridging the resulting V2 token to the caller. The V1
 * NFT ends up locked in the V2 contract while the victim's staking record is
 * left untouched, so their unstake reverts.
 */

const TRANSFER_TOPIC =
  '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef'

interface AuditArgs {
  out: string
  span: number
  fromBlock: number
}

const auditStaleStakes = async (
  args: AuditArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { ethers, log } = hre

  const V1 = '0x2ceB85a2402C94305526ab108e7597a102D6C175'
  const V2 = '0x8f9bbbB0282699921372A134b63799a48c7d17FC'
  const DIAMOND = '0xc14D994fe7C5858c93936cc3bD42bb9467d6fB2C'

  const provider = ethers.provider
  const latest = await provider.getBlockNumber()

  // 1. Replay every V1 Transfer to learn who last staked each token ID.
  log('')
  log('Scanning V1 Transfer logs...', { indent: 1, star: true })
  const logs: Array<{ topics: readonly string[]; blockNumber: number }> = []
  for (let b = args.fromBlock; b <= latest; b += args.span) {
    logs.push(
      ...(await provider.getLogs({
        address: V1,
        topics: [TRANSFER_TOPIC],
        fromBlock: b,
        toBlock: Math.min(b + args.span - 1, latest),
      }))
    )
  }
  log(`${logs.length} V1 transfers`, { indent: 2, star: true })

  const addr = (topic: string): string =>
    ethers.getAddress('0x' + topic.slice(-40))
  const lastStaker = new Map<string, string>()
  for (const l of logs) {
    if (addr(l.topics[2]) === DIAMOND) {
      lastStaker.set(BigInt(l.topics[3]).toString(), addr(l.topics[1]))
    }
  }

  // 2. Ask the diamond which of those stakers still have a live record.
  const facet = await ethers.getContractAt(
    [
      'function getStakedNFTs(address) view returns (uint256[])',
      'function previewUnstakeNFTs(address) view returns (uint256[], uint256[], uint8[])',
    ],
    DIAMOND
  )
  const v2 = await ethers.getContractAt(
    [
      'function convertV1TokenId(uint256) view returns (uint256)',
      'function balanceOf(address,uint256) view returns (uint256)',
    ],
    V2
  )

  const stakers = [...new Set(lastStaker.values())]
  log(`Checking ${stakers.length} historical stakers...`, {
    indent: 1,
    star: true,
  })

  const rows: Array<{ staker: string; v1Id: string; v2Id: string }> = []
  for (const staker of stakers) {
    const ids: bigint[] = await facet.getStakedNFTs(staker)
    for (const id of ids) {
      const v2Id: bigint = await v2.convertV1TokenId(id)
      rows.push({ staker, v1Id: id.toString(), v2Id: v2Id.toString() })
    }
  }

  // 3. A record is only unredeemable if the diamond no longer holds the V1 NFT.
  const v1 = await ethers.getContractAt(
    ['function ownerOf(uint256) view returns (address)'],
    V1
  )
  const stale: typeof rows = []
  for (const r of rows) {
    if ((await v1.ownerOf(r.v1Id)) !== DIAMOND) stale.push(r)
  }

  // 4. Size the mint needed to cover every claim, V1 records and V2 stakes alike.
  const owed = new Map<string, number>()
  for (const r of stale) owed.set(r.v2Id, (owed.get(r.v2Id) ?? 0) + 1)

  const mint: Array<{ v2Id: string; units: number }> = []
  for (const [v2Id, units] of owed) {
    const held = Number(await v2.balanceOf(DIAMOND, v2Id))
    if (units > held) mint.push({ v2Id, units: units - held })
  }

  const victims = new Set(stale.map((r) => r.staker))
  log('')
  log(`unredeemable staking records : ${stale.length}`, {
    indent: 1,
    star: true,
  })
  log(`affected stakers             : ${victims.size}`, {
    indent: 1,
    star: true,
  })
  log(
    `V2 units to mint to diamond  : ${mint.reduce((a, m) => a + m.units, 0)}`,
    {
      indent: 1,
      star: true,
    }
  )

  const outDir = path.resolve(args.out)
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(
    path.join(outDir, 'stale-stakes.json'),
    JSON.stringify({ stale, mint }, null, 2)
  )
  fs.writeFileSync(
    path.join(outDir, 'stale-stakes.csv'),
    'staker,v1_token_id,v2_token_id\n' +
      stale.map((r) => `${r.staker},${r.v1Id},${r.v2Id}`).join('\n')
  )
  fs.writeFileSync(
    path.join(outDir, 'mint-plan.csv'),
    'v2_token_id,units_to_mint\n' +
      mint.map((m) => `${m.v2Id},${m.units}`).join('\n')
  )
  log(`written to ${outDir}`, { indent: 1, star: true })
  log('')
}

task(
  'nft:audit-stale-stakes',
  'Finds staking records the diamond can no longer honour and sizes the mint to cover them'
)
  .addOptionalParam(
    'out',
    'Directory to write the report to',
    './audit',
    types.string
  )
  .addOptionalParam('span', 'Blocks per getLogs call', 1000000, types.int)
  .addOptionalParam(
    'fromBlock',
    'Block the V1 NFT was deployed at',
    12190312,
    types.int
  )
  .setAction(auditStaleStakes)
