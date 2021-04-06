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

const deployNFT: DeployFunction = async (hre) => {
  const { getNamedSigner, network, run } = hre

  const nftConfig = getNFT(network)
  const deployer = await getNamedSigner('deployer')

  // Make sure contracts are compiled
  await run('compile')

  const distributions: MerkleDistributorInfo[] = []
  const tiers: Array<{
    baseLoanSize: string
    contributionAsset: string
    contributionSize: string
    contributionMultiplier: string
    hashes: string[]
  }> = []
  for (const input of nftConfig) {
    const { balances, ...tierData } = input

    const distribution = generateMerkleDistribution(balances)
    distributions.push(distribution)
    tiers.push(tierData)
  }

  console.log()
  console.log('  ** Deploying Teller NFT **')
  console.log()

  const nft = await deployDiamond<ITellerNFT>({
    name: 'TellerNFT',
    facets: [
      'sto_Initializable',
      'sto_ERC721',
      'sto_Token',
      'sto_Tier',

      'ent_approve_ERC721_v1',
      'ent_transfer_ERC721_v1',

      'ent_initialize_NFT',
      'ent_mint_NFT',
      'ent_setContractURI_NFT',
      'ent_tier_NFT',

      // 'ext_supportsInterface_NFT',
      'ext_approve_ERC721_v1',
      'ext_balanceOf_ERC721_v1',
      'ext_details_ERC721_v1',
      'ext_ownerOf_ERC721_v1',

      'ext_tier_NFT',
      'ext_token_NFT',
      'ext_metadata_NFT',
    ],
    hre,
  }).then((c) => c.connect(deployer))

  console.log()
  console.log('  ** Deploying Teller NFT Distributor **')
  console.log()

  const nftDistributor = await deployDiamond<ITellerNFTDistributor>({
    name: 'TellerNFTDistributor',
    facets: [
      'sto_Initializable',
      'sto_Distributor',
      'ent_distributor_NFT',
      'ext_distributor_NFT',
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
    const contractURI =
      'https://gateway.pinata.cloud/ipfs/QmWAfQFFwptzRUCdF2cBFJhcB2gfHJMd7TQt64dZUysk3R'
    await nft.initialize(minters, contractURI).then(({ wait }) => wait())
    console.log(' * Teller NFT initialized')
  } catch (err) {
    if (err?.error?.message?.includes('already initialized')) {
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

  for (let i = 0; i < distributions.length; i++) {
    const merkleRoots = await nftDistributor.getTierMerkleRoots()

    if (merkleRoots[i] == null) {
      await nftDistributor.addTier(distributions[i].merkleRoot)
      console.log(` * Merkle root for tier ${i} added to distributor \n`)
    } else {
      console.log(
        ` * Merkle root for tier ${i} already added to distributor \n`
      )
    }
  }

  const distributionOutputPath = `deployments/${network.name}/_nftDistribution.json`
  fs.writeFileSync(
    distributionOutputPath,
    JSON.stringify(distributions, null, 2)
  )

  console.log(` ** Output written to ${distributionOutputPath}`)
  console.log()
}

deployNFT.tags = ['nft']

export default deployNFT
