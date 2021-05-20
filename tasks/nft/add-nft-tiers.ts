import * as ethers from 'ethers'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { TierInfo } from '../../types/custom/config-types'
import { ITellerNFT } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'

interface AddTiersArgs {
  sendTx?: boolean
}

export const addTiers = async (
  args: AddTiersArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { contracts, network, ethers, log } = hre

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
  log('Adding Tiers to Teller NFT', { indent: 2, star: true })
  log('')

  const { tiers } = getNFT(network)
  for (let i = 0; i < tiers.length; i++) {
    const tier = await nft.getTier(i)
    if (tier.contributionAsset === NULL_ADDRESS) {
      await nft.addTier(tiers[i])

      log(`Tier ${i} added`, { indent: 3, star: true })
    } else if (hashTier(tier) !== hashTier(tiers[i])) {
      log('')
      log(`Tier ${i} NOT MATCH existing one on NFT`, { indent: 3, star: true })
      log(`Existing: `, { indent: 4, star: true })
      logTier(tier, 5)
      log(`New: `, { indent: 4, star: true })
      logTier(tiers[i], 5)
      log('')
      throw new Error('NFT tiers config not match existing deployed')
    } else {
      log(`Tier ${i} already exists`, { indent: 3, star: true })
    }
  }
}

const hashTier = (tier: TierInfo): string => {
  let tierStr = ''
  tierStr += ethers.BigNumber.from(tier.baseLoanSize).toString()
  tierStr += tier.hashes.join('')
  tierStr += ethers.utils.getAddress(tier.contributionAsset)
  tierStr += ethers.BigNumber.from(tier.contributionSize).toString()
  tierStr += tier.contributionMultiplier.toString()
  return ethers.utils.hashMessage(tierStr)
}

const logTier = (tier: TierInfo, indent: number): void => {
  const indentStr = '  '.repeat(indent)
  console.log(
    `${indentStr}{
  ${indentStr}  baseLoanSize: ${ethers.BigNumber.from(
      tier.baseLoanSize
    ).toString()},
  ${indentStr}  hashes: [ ${JSON.stringify(tier.hashes.join(', '))} ],
  ${indentStr}  contributionAsset: ${ethers.utils.getAddress(
      tier.contributionAsset
    )}
  ${indentStr}  contributionSize: ${ethers.BigNumber.from(
      tier.contributionSize
    ).toString()},
  ${indentStr}  contributionMultiplier: ${tier.contributionMultiplier.toString()}
  ${indentStr}}
  `
  )
}

task(
  'add-nft-tiers',
  'Saves the tier information in the config file ("./config/nft.ts") directly to the NFT'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(addTiers)
