import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
  generateMerkleDistribution,
  MerkleDistributorInfo,
} from '../scripts/merkle/root'
import { ITellerNFT, ITellerNFTDistributor } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { deployDiamond } from '../utils/deploy-diamond'
import { deploy } from '../utils/deploy-helpers'

interface DeployNFTArgs {
  input: string
  output: string
}

export const deployNft = async (
  args: DeployNFTArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { input, output } = args

  const { getNamedSigner, ethers, run } = hre
  const deployer = await getNamedSigner('deployer')

  // Make sure contracts are compiled
  await run('compile')

  const inputData = JSON.parse(fs.readFileSync(input).toString())
  if (!Array.isArray(inputData))
    throw new Error(
      'Input file must be an array of tiers. run `hardhat deploy-nft-example` to see an example JSON format.'
    )

  const distributions: MerkleDistributorInfo[] = []
  const tiers: Array<{
    baseLoanSize: string
    contributionAsset: string
    contributionSize: string
    contributionMultiplier: string
    hashes: string[]
  }> = []
  for (const input of inputData) {
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
      'ent_approve_ERC721_v1',
      'ent_transfer_ERC721_v1',

      'ent_initialize_NFT',
      'ent_mint_NFT',
      'ent_setContractURI_NFT',
      'ent_tier_NFT',

      'ext_approve_ERC721_v1',
      'ext_balanceOf_ERC721_v1',
      'ext_details_ERC721_v1',
      'ext_ownerOf_ERC721_v1',
      'ext_metadata_ERC721_v1',

      'ext_tier_NFT',
      'ext_token_NFT',
    ],
    hre,
  }).then((c) => c.connect(deployer))

  console.log()
  console.log('  ** Deploying Teller NFT Distributor **')
  console.log()

  const nftDistributor = await deployDiamond<ITellerNFTDistributor>({
    name: 'TellerNFTDistributor',
    facets: ['ent_distributor_NFT', 'ext_distributor_NFT'],
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
      await nft.addTier(tiers[i])

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

  fs.writeFileSync(output, JSON.stringify(distributions, null, 2))

  console.log(` ** Output written to ${output}`)
  console.log()
}

task(
  'deploy-nft',
  'Deploys the Teller NFT Token and Distributor with a given merkle tree as input'
)
  .addParam(
    'input',
    'The JSON input file location to generate the merkle tree for Teller NFT tiers'
  )
  .addParam(
    'output',
    'The destination file to put the generated distribution info'
  )
  .setAction(deployNft)

export const deployNftExample = async (
  _args: any,
  _hre: HardhatRuntimeEnvironment
): Promise<void> => {
  console.log(`
  ** Example JSON file format for generating merkle roots for Teller NFT tiers **
  [
    { // Tier 1
      "hashes": [
        "0x1234...",
        "0x2345...",
        "0x3456..."
      ],
      "balances": [
        { "address": "0x...", "count": 7 },
        { "address": "0x...", "count": 20 }
        ...
      ]
    },
    { // Tier 2
      "hashes": [
        ...
      ],
      "balances": [
        ...
      ]
    }
  ]
  `)
}

task(
  'deploy-nft-example',
  'Generates an example JSON format the input file should follow'
).setAction(deployNftExample)
