import { BigNumberish } from 'ethers'
import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { MerkleDistributorInfo } from '../../scripts/merkle/root'
import { ITellerNFTDistributor } from '../../types/typechain'

interface ClaimNFTArgs {
  account: string
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

  const { account, merkleIndex } = args
  const checkedAddress = ethers.utils.getAddress(account)

  const nftDistributor = await contracts.get<ITellerNFTDistributor>(
    'TellerNFTDistributor'
  )
  if (!nftDistributor)
    throw new Error(`No Teller NFT Distributor is deployed for ${network.name}`)

  const { distributionsOutputFile, merkleTrees } = getNFT(network)
  const distributions: MerkleDistributorInfo[] = JSON.parse(
    fs.readFileSync(distributionsOutputFile).toString()
  )

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

  if (requests.length > 0) {
    await nftDistributor
      .claim(args.account, requests)
      .then(({ wait }) => wait())
  }

  log('Done.')
}

task('claim-nft', 'Claims an NFT on behalf of an account')
  .addParam('account', 'Address to claim NFTs for')
  .addOptionalParam(
    'merkleIndex',
    'Only claim tokens using the specified merkle index.'
  )
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(claimNFT)
