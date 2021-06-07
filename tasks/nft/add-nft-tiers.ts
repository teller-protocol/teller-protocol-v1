import * as ethers from 'ethers'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'

import { getNFT } from '../../config'
import { TierInfo } from '../../types/custom/config-types'
import { ITellerNFT } from '../../types/typechain'
import { TellerNFTDictionary } from '../../types/typechain/TellerNFTDictionary'
import { TellerNFT } from '../../types/typechain'

import { NULL_ADDRESS } from '../../utils/consts'

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

  const nft = await contracts.get<ITellerNFT>('TellerNFT')
  if (!nft)
    throw new Error(
      `No deployment for Teller NFT. Please run the NFT deployment script.`
    )

  const nftDictionary = await contracts.get<TellerNFTDictionary>(
    'TellerNFTDictionary'
  )

  log('')
  log('Adding Tiers to Teller NFT', { indent: 2, star: true })
  log('')
  const deployer = await getNamedSigner('deployer')
  const { tiers } = getNFT(network)
  for (let i = 0; i < tiers.length; i++) {
    //Add Tier information to the Teller NFT
    const tier = await nft.getTier(i)
    if (tier.contributionAsset === NULL_ADDRESS) {
      await nft
        .connect(deployer)
        .addTier(tiers[i])
        .then(({ wait }) => wait())

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
      log(`Tier ${i} already exists in NFT`, { indent: 3, star: true })
    }

    //Add Tier information to the Teller NFT Dictionary

    const cAsset = await nftDictionary.contributionAssets(i)

    if (cAsset === NULL_ADDRESS) {
      log(`Creating Tier ${i} in Dictionary`, { indent: 3, star: true })

      await nftDictionary
        .connect(deployer)
        .setTier(i, tiers[i])
        .then(({ wait }) => wait())
    } else {
      log(`Tier ${i} already exists in Dictionary`, { indent: 3, star: true })
    }
  }

  /* Inject the compressedTiersMapping    */
  //iterate through all tokens to get their tierIndex  (run a task)

  const claimedNFTData = await getAllTellerNFTTierData(hre)

  const compressedTierData = compressTokenTierMappingsFromArray(claimedNFTData)

  await nftDictionary
    .connect(deployer)
    .setAllTokenTierMappings(compressedTierData)
    .then(({ wait }) => wait())
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

const compressTokenTierMappingsFromArray = (
  tokenTiers: Array<ethers.BigNumber>
): Array<string> => {
  let tokenTierMappingCompressed = []

  let tokenTierMappingLengthMax = tokenTiers.length / 32

  for (let i = 0; i < tokenTierMappingLengthMax; i++) {
    let newRow = '0x'

    for (let j = 0; j < 32; j++) {
      let tokenId = i * 32 + j

      if (tokenId < tokenTiers.length) {
        let tierLevelHexBytes = tokenTiers[tokenId].toHexString().substr(2)
        // console.log('tier level hex bytes', tierLevelHexBytes.padStart(2, '0'))
        newRow += tierLevelHexBytes.padStart(2, '0')
      } else {
        newRow += '00'
      }
    }

    tokenTierMappingCompressed.push(newRow)
  }

  return tokenTierMappingCompressed
}

export const getAllTellerNFTTierData = async (
  hre: HardhatRuntimeEnvironment
): Promise<Array<ethers.BigNumber>> => {
  const { contracts, ethers, toBN } = hre

  const nft = await contracts.get<TellerNFT>('TellerNFT')

  const info: Array<ethers.BigNumber> = []
  try {
    let nftID = ethers.BigNumber.from(0)
    while (await nft.ownerOf(nftID)) {
      const { index_ } = await nft.getTokenTier(nftID)

      info.push(index_)
      nftID = nftID.add(1)
    }
  } catch (e) {
    // Throws once all NFTs have been looped
  }
  return info
}

task(
  'add-nft-tiers',
  'Saves the tier information in the config file ("./config/nft.ts") directly to the NFT'
)
  .addFlag('sendTx', 'Required flag to ensure this is not ran on accident')
  .setAction(addTiers)
