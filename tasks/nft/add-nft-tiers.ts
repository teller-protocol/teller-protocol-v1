import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { ITellerNFT } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'

interface AddTiersArgs {
  sendTx?: boolean
}

export const addTiers = async (
  args: AddTiersArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, log } = hre

  if (!['localhost', 'hardhat'].includes(network.name) && !args.sendTx) {
    log('')
    log('================================================')
    log('  Must pass --send-tx flag to execute tx')
    log('================================================')
    log('')
    return
  }

  const nft = await contracts.get<ITellerNFT>('TellerNFT')
  if (!nft)
    throw new Error(
      `No deployment for Teller NFT. Please run the NFT deployment script.`
    )

  log('')
  log('Adding Tiers to Teller NFT', { indent: 1, star: true })
  log('')

  const { tiers } = getNFT(network)
  for (let i = 0; i < tiers.length; i++) {
    const tier = await nft.getTier(i)
    if (tier.contributionAsset === NULL_ADDRESS) {
      await nft.addTier(tiers[i]).then(({ wait }) => wait())

      log(`Tier ${i} added`, { indent: 2, star: true })
    } else {
      log(`Tier ${i} already exists`, { indent: 2, star: true })
    }
  }
}

task(
  'add-nft-tiers',
  'Saves the tier information in the config file ("./config/nft.ts") directly to the NFT'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(addTiers)
