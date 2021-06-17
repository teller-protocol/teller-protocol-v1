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
  const { contracts, network, log, getNamedSigner } = hre

  if (!['localhost', 'hardhat'].includes(network.name) && !args.sendTx) {
    log('')
    log('================================================')
    log('  Must pass --send-tx flag to execute tx')
    log('================================================')
    log('')
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

  log('')
  log('Adding tier merkles to NFT Distributor', { indent: 2, star: true })
  log('')

  const distributions: MerkleDistributorInfo[] = []
  for (const tree of merkleTrees) {
    const { tierIndex, balances } = tree

    const info = generateMerkleDistribution(tierIndex, balances)
    distributions.push(info)
  }
  const deployer = await getNamedSigner('deployer')
  const distributionsInfo: MerkleDistributorInfo[] = []
  const merkleRoots = await nftDistributor.getMerkleRoots()
  for (let i = 0; i < distributions.length; i++) {
    const info = distributions[i]
    distributionsInfo.push(info)

    if (merkleRoots.length <= i) {
      // Add new merkle root
      await nftDistributor
        .connect(deployer)
        .addMerkle(info.tierIndex, info.merkleRoot)
        .then(({ wait }) => wait())
      log(
        `NEW merkle root for tier ${info.tierIndex} added: ${info.merkleRoot}`,
        {
          indent: 3,
          star: true,
        }
      )
    } else if (!merkleRoots[i].tierIndex.eq(info.tierIndex)) {
      log('')
      log(
        `Merkle root at index ${i} NOT MATCH existing tier index on distributor`,
        { indent: 4, star: true }
      )
      log(`Existing: ${merkleRoots[i].tierIndex.toString()}`, {
        indent: 5,
        star: true,
      })
      log(`New:      ${info.tierIndex.toString()}`, { indent: 5, star: true })
      log('')
      throw new Error('NFT Merkle does not match tier index on chain')
    } else if (merkleRoots[i].merkleRoot != info.merkleRoot) {
      log('')
      log(
        `Merkle root for tier ${info.tierIndex} NOT MATCH existing one on distributor`,
        { indent: 4, star: true }
      )
      log(`Existing: ${merkleRoots[i].merkleRoot}`, { indent: 5, star: true })
      log(`New:      ${info.merkleRoot}`, { indent: 5, star: true })
      log('')
      throw new Error('NFT Merkle root does not on chain')
    } else if (merkleRoots[i].merkleRoot === info.merkleRoot) {
      log(
        `Merkle root for tier ${info.tierIndex} ALREADY added: ${info.merkleRoot}`,
        { indent: 3, star: true }
      )
    }
  }

  fs.writeFileSync(
    distributionsOutputFile,
    JSON.stringify(distributionsInfo, null, 2)
  )

  log('')
  log(`Output written to ${distributionsOutputFile}`, { indent: 3, star: true })
  log('')
}

task(
  'add-nft-merkles',
  'Generates and adds the merkles defined in the config file (./config/nft.ts) to the Teller NFT Distributor'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(addMerkles)
