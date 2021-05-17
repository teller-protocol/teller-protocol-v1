import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { MerkleDistributorInfo } from '../../scripts/merkle/root'
import { ITellerNFT, ITellerNFTDistributor } from '../../types/typechain'

interface ViewNFTsArgs {
  account?: string
  tier?: number
  claimable: boolean
  claimed: boolean
}

export const viewNFTs = async (
  args: ViewNFTsArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { account, tier, claimable, claimed } = args
  const { contracts, network, ethers, log } = hre

  const nft = await contracts.get<ITellerNFT>('TellerNFT')
  const nftDistributor = await contracts.get<ITellerNFTDistributor>(
    'TellerNFTDistributor'
  )
  if (!nft || !nftDistributor)
    throw new Error(
      `Teller NFT has not been fully deployed yet on ${network.name}`
    )

  const getAll = account == null && tier == null && !claimable && !claimed

  const { merkleTrees, distributionsOutputFile } = getNFT(network)
  const distributions: MerkleDistributorInfo[] = JSON.parse(
    fs.readFileSync(distributionsOutputFile).toString()
  )

  const tierIndices: { claimable: Set<number>; claimed: Set<number> } = {
    claimable: new Set(),
    claimed: new Set(),
  }
  interface TierTokens {
    [index: number]: number
  }
  const tierTokens: { claimable: TierTokens; claimed: TierTokens } = {
    claimable: {},
    claimed: {},
  }
  for (let i = 0; i < distributions.length; i++) {
    const { merkleRoot, tierIndex, tokenTotal, claims } = distributions[i]
    const info: MerkleDistributorInfo = {
      merkleRoot,
      tierIndex,
      tokenTotal,
      claims: {},
    }

    if (getAll) {
      info.claims = claims
    } else if (account != null) {
      const checkedAddress = ethers.utils.getAddress(account)
      const { [checkedAddress]: claim } = claims
      info.claims[checkedAddress] = claim
    } else if (tier != null && merkleTrees[i].tierIndex === tier) {
      info.claims = { ...info.claims, ...claims }
    }

    const claimEntries = Object.entries(info.claims)
    await Promise.all(
      claimEntries.map(async ([, claim]) => {
        if (!claim) return
        const isClaimed = await nftDistributor.isClaimed(i, claim.index)

        const skip = (claimed && !isClaimed) || (claimable && isClaimed)
        if (skip) return

        const { tierIndex } = merkleTrees[i]
        if (isClaimed) {
          tierIndices.claimed.add(tierIndex)
          tierTokens.claimed[tierIndex] =
            parseInt(claim.amount, 16) + (tierTokens.claimed[tierIndex] ?? 0)
        } else {
          tierIndices.claimable.add(tierIndex)
          tierTokens.claimable[tierIndex] =
            parseInt(claim.amount, 16) + (tierTokens.claimable[tierIndex] ?? 0)
        }
      })
    )
  }

  log('')

  log(`Claimable NFTs`, { indent: 2, star: true })
  let claimableTotal = 0
  for (const tierIndex of tierIndices.claimable) {
    log(`Tier ${tierIndex}: ${tierTokens.claimable[tierIndex]}`, { indent: 4 })
    claimableTotal += tierTokens.claimable[tierIndex]
  }
  log(`Total NFTs: ${claimableTotal}`, { indent: 3 })

  log('')

  log(`Already claimed NFTs`, { indent: 2, star: true })
  let claimedTotal = 0
  for (const tierIndex of tierIndices.claimed) {
    log(`Tier ${tierIndex}: ${tierTokens.claimed[tierIndex]}`, { indent: 4 })
    claimedTotal += tierTokens.claimed[tierIndex]
  }
  log(`Total NFTs: ${claimedTotal}`, { indent: 3 })

  log('')

  log(`Total NFTs: ${claimedTotal + claimableTotal}`, { indent: 2, star: true })

  log('')
}

task('view-nfts', 'Retrieve information about NFTs on the blockchain')
  .addOptionalParam('account', 'Address to view NFTs for')
  .addOptionalParam('tier', 'A tier index to view NFTs for')
  .addFlag(
    'claimable',
    'Only display info about NFTs that are yet to be claimed'
  )
  .addFlag(
    'claimed',
    'Only display info about NFTs that have ALREADY been claimed'
  )
  .setAction(viewNFTs)
