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
  printArgs?: boolean
}

export const claimNFT = async (
  args: ClaimNFTArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, ethers, toBN, log } = hre

  // Validate that exactly one of printArgs or sendTx is set for non-local networks
  if (!['localhost', 'hardhat'].includes(network.name)) {
    if (!args.sendTx && !args.printArgs) {
      console.log()
      console.log('================================================')
      console.log('  Must pass either --send-tx or --print-args')
      console.log('================================================')
      console.log()
      return
    }
    if (args.sendTx && args.printArgs) {
      console.log()
      console.log('================================================')
      console.log('  Cannot use both --send-tx and --print-args')
      console.log('  Please choose only one')
      console.log('================================================')
      console.log()
      return
    }
  }

  const { account, merkleIndex } = args
  const checkedAddress = ethers.getAddress(account)

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
    const merkleIndex = Number(toBN(request.merkleIndex))
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
    if (args.printArgs) {
      // Print non-encoded arguments
      log('Function Arguments:', { indent: 2, star: true })
      log(`Contract: ${nftDistributor.address}`, { indent: 4 })
      log(`Function: claim(address,tuple[])`, { indent: 4 })
      log(
        `Etherscan: https://etherscan.io/address/${nftDistributor.address}#writeProxyContract#F1`,
        { indent: 4 }
      )
      log(`Account: ${args.account}`, { indent: 4 })
      log('Requests:', { indent: 4 })
      requests.forEach((req, idx) => {
        log(`Request ${idx}:`, { indent: 6 })
        log(`  merkleIndex: ${BigInt(req.merkleIndex).toString()}`, {
          indent: 6,
        })
        log(`  nodeIndex: ${BigInt(req.nodeIndex).toString()}`, {
          indent: 6,
        })
        log(`  amount: ${BigInt(req.amount).toString()}`, { indent: 6 })
        log(`  merkleProof: [${req.merkleProof.join(', ')}]`, { indent: 6 })
      })
      log('')

      // Print encoded requests for Etherscan tuple[] input
      const encodedRequests = requests.map((req) => [
        BigInt(req.merkleIndex).toString(),
        BigInt(req.nodeIndex).toString(),
        BigInt(req.amount).toString(),
        req.merkleProof,
      ])
      log('Encoded Requests (for Etherscan tuple[] input):', {
        indent: 2,
        star: true,
      })
      log(JSON.stringify(encodedRequests), { indent: 4 })
      log('')

      // Print encoded calldata
      const encodedData = nftDistributor.interface.encodeFunctionData('claim', [
        args.account,
        requests,
      ])
      log('Full Encoded Calldata:', { indent: 2, star: true })
      log(encodedData, { indent: 4 })
      log('')
    } else {
      await nftDistributor
        .claim(args.account, requests)
        .then(({ wait }) => wait())
    }
  }

  log('Done.')
}

task('claim-nft', 'Claims an NFT on behalf of an account')
  .addParam('account', 'Address to claim NFTs for')
  .addOptionalParam(
    'merkleIndex',
    'Only claim tokens using the specified merkle index.'
  )
  .addFlag('sendTx', 'Execute the transaction on-chain')
  .addFlag(
    'printArgs',
    'Print encoded and non-encoded arguments without sending'
  )
  .setAction(claimNFT)
