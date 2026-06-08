import fs from 'fs'
import path from 'path'

import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

const POLY_TELLER_NFT_ADDRESS = '0x83AF2b36A3F8593203b2098CBec616A57f1A80cC'

interface RecoverArgs {
  sendTx?: boolean
}

interface AttackRow {
  txHash: string
  v1TokenId: string
  v2TokenId: string
  oldOwner: string
  attacker: string
}

const parseCSV = (filePath: string): AttackRow[] => {
  const content = fs.readFileSync(filePath).toString()
  const lines = content.trim().split('\n')
  const header = lines[0].split(',')

  const txHashIdx = header.indexOf('tx_hash')
  const v1TokenIdx = header.indexOf('token_id_decimal')
  const v2TokenIdx = header.indexOf('token_id_v2')
  const oldOwnerIdx = header.indexOf('old_owner_staker')
  const attackerIdx = header.indexOf('new_owner_attacker')

  if (v2TokenIdx === -1) {
    throw new Error(
      'CSV is missing token_id_v2 column. Run investigation/query_v2_tokenids.sh first.'
    )
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(',')
    return {
      txHash: cols[txHashIdx],
      v1TokenId: cols[v1TokenIdx],
      v2TokenId: cols[v2TokenIdx],
      oldOwner: cols[oldOwnerIdx].toLowerCase(),
      attacker: cols[attackerIdx].toLowerCase(),
    }
  })
}

const recoverStolenNFTs = async (
  args: RecoverArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { ethers, network, log, getNamedAccounts } = hre

  if (!['localhost', 'hardhat'].includes(network.name) && !args.sendTx) {
    log('')
    log('================================================')
    log('  Must pass --send-tx flag to execute tx')
    log('================================================')
    log('')
    return
  }

  const { deployer } = await getNamedAccounts()
  const signer = await ethers.provider.getSigner(deployer)

  // Read attack transactions CSV
  const csvPath = path.resolve(
    __dirname,
    '../../investigation/bridgeNFTsV1_attack_transactions.csv'
  )
  const rows = parseCSV(csvPath)

  log('')
  log(`Loaded ${rows.length} attack transactions from CSV`, {
    indent: 1,
    star: true,
  })

  // Connect to PolyTellerNFT
  const nft = await ethers.getContractAt(
    'PolyTellerNFT',
    POLY_TELLER_NFT_ADDRESS,
    signer
  )

  // Group by attacker address for batch burn
  const attackerTokens = new Map<string, string[]>()
  // Group by victim address for mints
  const victimTokens = new Map<string, string[]>()

  for (const row of rows) {
    const existing = attackerTokens.get(row.attacker) ?? []
    existing.push(row.v2TokenId)
    attackerTokens.set(row.attacker, existing)

    const victimExisting = victimTokens.get(row.oldOwner) ?? []
    victimExisting.push(row.v2TokenId)
    victimTokens.set(row.oldOwner, victimExisting)
  }

  log(`Attacker addresses: ${attackerTokens.size}`, { indent: 2, star: true })
  log(`Victim addresses: ${victimTokens.size}`, { indent: 2, star: true })

  // === DRY RUN: Log all planned operations ===
  log('')
  log('=== Planned Burns ===', { indent: 1 })
  for (const [attacker, tokenIds] of attackerTokens) {
    log(`Burn ${tokenIds.length} tokens from ${attacker}: [${tokenIds.join(', ')}]`, {
      indent: 2,
      star: true,
    })
  }

  log('')
  log('=== Planned Mints ===', { indent: 1 })
  for (const [victim, tokenIds] of victimTokens) {
    log(`Mint ${tokenIds.length} tokens to ${victim}: [${tokenIds.join(', ')}]`, {
      indent: 2,
      star: true,
    })
  }

  if (!args.sendTx && !['localhost', 'hardhat'].includes(network.name)) {
    log('')
    log('Dry run complete. Pass --send-tx to execute.', { indent: 1 })
    return
  }

  // === EXECUTE: Burn attacker tokens ===
  log('')
  log('=== Executing Burns ===', { indent: 1 })

  for (const [attacker, tokenIds] of attackerTokens) {
    const amounts = tokenIds.map(() => '1')

    log(`Burning ${tokenIds.length} tokens from ${attacker}...`, {
      indent: 2,
      star: true,
    })

    const tx = await nft.adminBurnBatch(attacker, tokenIds, amounts)
    const receipt = await tx.wait()

    log(
      `Burned! tx: ${receipt.transactionHash} (gas: ${receipt.gasUsed.toString()})`,
      { indent: 3, star: true }
    )
  }

  // === EXECUTE: Mint to victims ===
  log('')
  log('=== Executing Mints ===', { indent: 1 })

  for (const [victim, tokenIds] of victimTokens) {
    for (const tokenId of tokenIds) {
      log(`Minting token ${tokenId} to ${victim}...`, {
        indent: 2,
        star: true,
      })

      const tx = await nft.adminMint(victim, tokenId, 1)
      const receipt = await tx.wait()

      log(
        `Minted! tx: ${receipt.transactionHash} (gas: ${receipt.gasUsed.toString()})`,
        { indent: 3, star: true }
      )
    }
  }

  // === VERIFY ===
  log('')
  log('=== Verification ===', { indent: 1 })

  // Check attacker balances
  for (const [attacker, tokenIds] of attackerTokens) {
    for (const tokenId of tokenIds) {
      const balance = await nft.balanceOf(attacker, tokenId)
      if (balance.toString() !== '0') {
        log(`WARNING: Attacker ${attacker} still has balance ${balance} for token ${tokenId}`, {
          indent: 2,
          star: true,
        })
      }
    }
    log(`Attacker ${attacker}: all balances are 0`, { indent: 2, star: true })
  }

  // Check victim balances
  for (const [victim, tokenIds] of victimTokens) {
    for (const tokenId of tokenIds) {
      const balance = await nft.balanceOf(victim, tokenId)
      if (balance.toString() !== '1') {
        log(`WARNING: Victim ${victim} has balance ${balance} for token ${tokenId} (expected 1)`, {
          indent: 2,
          star: true,
        })
      }
    }
    log(`Victim ${victim}: all balances verified`, { indent: 2, star: true })
  }

  log('')
  log('Recovery complete!', { indent: 1, star: true })
}

task(
  'recover-stolen-nfts',
  'Burns attacker NFTs and mints replacements to victims from the bridgeNFTsV1 exploit'
)
  .addFlag('sendTx', 'Required flag to execute transactions on non-local networks')
  .setAction(recoverStolenNFTs)
