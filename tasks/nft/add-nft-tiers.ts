import colors from "colors"
import * as ethers from "ethers"
import { task } from "hardhat/config"
import { HardhatRuntimeEnvironment } from "hardhat/types"

import { getNFT } from "../../config"
import { ITellerNFT, TellerNFT, TellerNFTDictionary, TellerNFTV2 } from "../../types/typechain"
import { NULL_ADDRESS } from "../../utils/consts"

interface AddTiersArgs {
  sendTx?: boolean
}

export const addTiers = async (
  args: AddTiersArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, ethers, log, getNamedSigner } = hre

  if (!['localhost', 'hardhat'].includes(network.name) && !args.sendTx) {
    log('')
    log('================================================')
    log('  Must pass --send-tx flag to execute tx')
    log('================================================')
    log('')
    return
  }

  const deployer = await getNamedSigner('deployer')
  const nft = await contracts.get<TellerNFTV2>('TellerNFT_V2')
  if (!nft)
    throw new Error(
      `No deployment for Teller NFT. Please run the NFT deployment script.`
    )

  log('')
  log('Adding Tiers to Teller NFT', { indent: 2, star: true })
  log('')

  const existingTiersCount = await nft.tierCount()
  const tierDataToCreate: Parameters<TellerNFTV2['createTiers']>[0] = []
  const tierHashesToCreate: Parameters<TellerNFTV2['createTiers']>[1] = []

  const { tiers } = getNFT(network)
  for (let i = 0; i < tiers.length; i++) {
    const tierIndex = i + 1
    if (existingTiersCount.gt(i)) {
      log(`Tier ${tierIndex} ${colors.yellow('already')} exists`, { indent: 3, star: true })
    } else {
      log(`Tier ${tierIndex} ${colors.italic('pending...')}`, { indent: 3, star: true })

      const { hashes, ...tierData } = tiers[i]
      tierDataToCreate.push(tierData)
      tierHashesToCreate.push(hashes)
    }
  }

  log('')

  if (tierDataToCreate.length > 0) {
    for (let i = 0; i < tierDataToCreate.length; i += 2) {
      const receipt = await nft
        .connect(deployer)
        .createTiers(
          tierDataToCreate.slice(i, i + 2),
          tierHashesToCreate.slice(i, i + 2)
        )
        .then(({ wait }) => wait())

      const gas = colors.cyan(`${receipt.gasUsed.toString()} gas`)
      log(`Tiers ${i + 1}-${i + 2} created with ${gas}`, { indent: 3, star: true })
    }
  } else {
    log(`All NFT tiers have ${colors.yellow('already')} been created`, { indent: 3, star: true })
  }
}

task(
  'add-nft-tiers',
  'Saves the tier information in the config file ("./config/nft.ts") directly to the NFT'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(addTiers)
