import { DeployFunction } from 'hardhat-deploy/types'
import fs from 'fs'
import {
  generateMerkleDistribution,
  MerkleDistributorInfo,
} from '../scripts/merkle/root'
import { deployDiamond } from '../utils/deploy-diamond'
import { NULL_ADDRESS } from '../utils/consts'
import { getNFT } from '../config'
import { ITellerNFT, ITellerNFTDistributor } from '../types/typechain'
import { deploy } from '../utils/deploy-helpers'
import { TierInfo } from '../types/custom/config-types'

const deployNFT: DeployFunction = async (hre) => {
  const { getNamedSigner, network, run } = hre

  const { tiers, merkleTrees } = getNFT(network)
  const deployer = await getNamedSigner('deployer')

  // Make sure contracts are compiled
  await run('compile')

  const distributions: Array<{
    tierIndex: number
    info: MerkleDistributorInfo
  }> = []
  for (const tree of merkleTrees) {
    const { tierIndex, balances } = tree

    const info = generateMerkleDistribution(balances)
    distributions.push({ tierIndex, info })
  }

  console.log()
  console.log('  ** Deploying Teller NFT **')
  console.log()

  const nft = await deploy<ITellerNFT>({
    contract: 'TellerNFT',
    hre,
  }).then((c) => c.connect(deployer))

  console.log()
  console.log('  ** Deploying Teller NFT Distributor **')
  console.log()

  const nftDistributor = await deployDiamond<ITellerNFTDistributor>({
    name: 'TellerNFTDistributor',
    facets: [
      'ent_initialize_NFTDistributor_v1',
      'ent_addMerkle_NFTDistributor_v1',
      'ent_claim_NFTDistributor_v1',
      'ext_distributor_NFT_v1',
    ],
    execute: {
      methodName: 'initialize',
      args: [nft.address, await deployer.getAddress()],
    },
    hre,
  }).then((c) => c.connect(deployer))

  console.log()
  console.log('  ** Initializing Teller NFT **')
  console.log()

  try {
    const minters: string[] = [
      nftDistributor.address,
      await deployer.getAddress(),
    ]
    await nft.initialize(minters).then(({ wait }) => wait())
    console.log(' * Teller NFT initialized')
  } catch (err) {
    const message = err?.error?.message ?? err?.message ?? ''
    if (message.includes('already initialized')) {
      console.log(' * Teller NFT already initialized')
    } else {
      throw err
    }
  }

  console.log()
  console.log('  ** Adding Tiers to Teller NFT **')
  console.log()

  for (let i = 0; i < tiers.length; i++) {
    const tier = await nft.getTier(i)
    if (tier.contributionAsset === NULL_ADDRESS) {
      await nft.addTier(tiers[i]).then(({ wait }) => wait())

      console.log(` * Tier ${i} added`)
    } else {
      console.log(` * Tier ${i} already exists`)
    }
  }

  console.log()
  console.log('  ** Adding Merkle Roots to NFT Distributor **')
  console.log()

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
        ` * Merkle root for tier ${tierIndex} added: ${info.merkleRoot} \n`
      )
    } else {
      console.log(
        ` * Merkle root for tier ${tierIndex} ALREADY added: ${info.merkleRoot} \n`
      )
    }
  }

  const distributionOutputPath = `deployments/${network.name}/_nftDistribution.json`
  fs.writeFileSync(
    distributionOutputPath,
    JSON.stringify(distributionsInfo, null, 2)
  )

  console.log(` ** Output written to ${distributionOutputPath}`)
  console.log()
}

deployNFT.tags = ['nft']

export default deployNFT
