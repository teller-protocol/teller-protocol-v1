import { BigNumberish } from 'ethers'
import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { ITellerNFTDistributor } from '../../types/typechain'

interface ClaimNFTArgs {
  address: string
  merkleIndex?: number
  sendTx?: boolean
}

export const claimNFT = async (
  args: ClaimNFTArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, ethers, toBN, log } = hre

  if (!['localhost', 'hardhat'].includes(network.name) && !args.sendTx) {
    console.log()
    console.log('================================================')
    console.log('  Must pass --send-tx flag to execute tx')
    console.log('================================================')
    console.log()
    return
  }

  const { address, merkleIndex } = args
  const checkedAddress = ethers.utils.getAddress(address)

  const nftDistributor = await contracts.get<ITellerNFTDistributor>(
    'TellerNFTDistributor'
  )
  if (!nftDistributor)
    throw new Error(`No Teller NFT Distributor is deployed for ${network.name}`)

  const { distributions, merkleTrees } = getNFT(network)

  const requests: Array<{
    merkleIndex: BigNumberish
    nodeIndex: BigNumberish
    amount: BigNumberish
    merkleProof: string[]
  }> = []

  if (merkleIndex) {
    const {
      claims: { [checkedAddress]: claim },
    } = distributions[merkleIndex]
    requests.push({
      merkleIndex,
      nodeIndex: claim.index,
      amount: parseInt(claim.amount, 16),
      merkleProof: claim.proof,
    })
  } else {
    for (let i = 0; i < distributions.length; i++) {
      const {
        claims: { [checkedAddress]: claim },
      } = distributions[i]
      if (!claim) continue

      const isClaimed = await nftDistributor.isClaimed(i, claim.index)
      if (!isClaimed) {
        requests.push({
          merkleIndex: i,
          nodeIndex: claim.index,
          amount: parseInt(claim.amount, 16),
          merkleProof: claim.proof,
        })
      }
    }
  }

  const tierIndices: number[] = []
  const tierTokens: { [index: number]: number } = []
  for (const request of requests) {
    const merkleIndex = toBN(request.merkleIndex).toNumber()
    const { claims } = distributions[merkleIndex]
    const { tierIndex } = merkleTrees[merkleIndex]

    tierIndices.push(tierIndex)
    tierTokens[tierIndex] = parseInt(claims[checkedAddress].amount, 16)
  }
  const sortedTierIndices = tierIndices.sort((a, b) => a - b)

  log('')
  log(`Claiming NFTs for ${checkedAddress}`, { indent: 2, star: true })
  log(`Tiers: ${tierIndices}`, { indent: 4 })
  sortedTierIndices.forEach((tierIndex) => {
    log(`Tier ${tierIndex}: ${tierTokens[tierIndex]}`, { indent: 6 })
  })
  log('')

  await nftDistributor.claim(args.address, requests)
}

task('claim-nft', 'Claims an NFT on behalf of an account')
  .addParam('address', 'Address to claim NFTs for')
  .addOptionalParam(
    'merkleIndex',
    'Only claim tokens using the specified merkle index.'
  )
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(claimNFT)
