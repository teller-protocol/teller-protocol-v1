import { BigNumberish } from 'ethers'
import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { ITellerNFTDistributor } from '../../types/typechain'

interface ClaimNFTArgs {
  address: string
  sendTx?: boolean
}

export const claimNFT = async (
  args: ClaimNFTArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network } = hre

  if (network.name !== 'localhost' && !args.sendTx) {
    console.log()
    console.log('================================================')
    console.log('  Must pass --send-tx flag to execute tx')
    console.log('================================================')
    console.log()
    return
  }

  const { address } = args

  const nftDistributor = await contracts.get<ITellerNFTDistributor>(
    'TellerNFTDistributor'
  )
  if (!nftDistributor)
    throw new Error(`No Teller NFT Distributor is deployed for ${network.name}`)

  const { distributionsOutputFile } = getNFT(network)
  const distributions = JSON.parse(
    fs.readFileSync(distributionsOutputFile).toString()
  )

  const requests: Array<{
    merkleIndex: BigNumberish
    nodeIndex: BigNumberish
    amount: BigNumberish
    merkleProof: string[]
  }> = []
  for (let i = 0; i < distributions.length; i++) {
    const {
      claims: { [address]: claim },
    } = distributions[i]
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
  console.log(requests)

  await nftDistributor.claim(args.address, requests.slice(0, 1))
}

task('claim-nft', 'Claims an NFT on behalf of an account')
  .addParam('address', 'Address to claim NFTs for')
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(claimNFT)
