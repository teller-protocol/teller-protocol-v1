import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import {
  generateMerkleDistribution,
  MerkleDistributorInfo,
} from '../../scripts/merkle/root'
import { ITellerNFTDistributor } from '../../types/typechain'

interface AddMerklesArgs {
  sendTx?: boolean
}

export const addMerkles = async (
  args: AddMerklesArgs,
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

  const { merkleTrees, distributionsOutputFile } = getNFT(network)
  if (!merkleTrees || !Array.isArray(merkleTrees))
    throw new Error(
      `Error in the merkle trees. Check "./config/nft.ts" that one exists for ${network.name}`
    )

  const nftDistributor = await contracts.get<ITellerNFTDistributor>(
    'TellerNFTDistributor'
  )
  if (!nftDistributor)
    throw new Error(`No Teller NFT Distributor is deployed for ${network.name}`)

  console.log()
  console.log('  ** Adding Merkle Roots to NFT Distributor **')
  console.log()

  const distributions: Array<{
    tierIndex: number
    info: MerkleDistributorInfo
  }> = []
  for (const tree of merkleTrees) {
    const { tierIndex, balances } = tree

    const info = generateMerkleDistribution(balances)
    distributions.push({ tierIndex, info })
  }

  const distributionsInfo: MerkleDistributorInfo[] = []
  for (let i = 0; i < distributions.length; i++) {
    const { tierIndex, info } = distributions[i]
    distributionsInfo.push(info)
    const merkleRoots = await nftDistributor.getMerkleRoots()

    if (merkleRoots[i] == null) {
      await nftDistributor
        .addMerkle(tierIndex, info.merkleRoot)
        .then(({ wait }) => wait())
      console.log(
        ` * NEW merkle root for tier ${tierIndex} added: ${info.merkleRoot}`
      )
    } else {
      console.log(
        ` * Merkle root for tier ${tierIndex} ALREADY added: ${info.merkleRoot}`
      )
    }
  }

  fs.writeFileSync(
    distributionsOutputFile,
    JSON.stringify(distributionsInfo, null, 2)
  )

  if (network.name !== 'hardhat') {
    console.log()
    console.log(` ** Output written to ${distributionsOutputFile}`)
  }
  console.log()
}

task(
  'add-nft-merkles',
  'Generates and adds the merkles defined in the config file (./config/nft.ts) to the Teller NFT Distributor'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(addMerkles)
