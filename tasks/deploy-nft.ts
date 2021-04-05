import fs from 'fs'
import { task } from 'hardhat/config'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
  generateMerkleDistribution,
  MerkleDistributorInfo,
} from '../scripts/merkle/root'
import { ITellerNFT, NFTDistributor } from '../types/typechain'
import { NULL_ADDRESS } from '../utils/consts'
import { deployDiamond } from '../utils/deploy-diamond'
import { deploy, deployLogic } from '../utils/deploy-helpers'

interface DeployNFTArgs {
  input: string
  output: string
}

export const deployNft = async (
  args: DeployNFTArgs,
  hre: HardhatRuntimeEnvironment
): Promise<void> => {
  const { input, output } = args

  const { getNamedAccounts, run } = hre
  const { deployer, lender } = await getNamedAccounts()

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

  const {} = await deployDiamond<ITellerNFT>({
    name: 'TellerNFT',
    facets: [
      'ctx_ERC721_v1',
      'ent_initialize_NFT_v1',
      'ent_mint_NFT_v1',
      'ent_tier_NFT_v1',
      'ext_tier_NFT_v1',
      'ext_token_NFT_v1',
    ],
    hre,
  })
  const nft = await deploy<TellerNFT>({
    hre,
    contract: 'TellerNFT',
  })

  console.log()
  console.log('  ** Deploying Teller NFT Distributor **')
  console.log()

  const nftDistributorLogic = await deployLogic<NFTDistributor>({
    hre,
    contract: 'NFTDistributor',
  })
  const nftDistributor = await deploy<NFTDistributor>({
    hre,
    contract: 'NFTDistributor',
  })

  console.log()
  console.log('  ** Initializing NFT Distributor **')
  console.log()

  const factoryNFTAddress = await nftDistributor.nft()
  if (factoryNFTAddress !== nft.address) {
    await nftDistributor.initialize(nft.address).then(({ wait }) => wait())

    console.log(' * Initialized NFT Distributor')
  } else {
    console.log(' * NFT Distributor already initialized')
  }

  console.log()
  console.log('  ** Initializing Teller NFT **')
  console.log()

  try {
    const minters = [nftDistributor.address, deployer]

    console.log(' * Adding Minters')
    for (const minter of minters) {
      console.log(`     * ${minter}`)
    }

    await nft.initialize(minters).then(({ wait }) => wait())
  } catch (err) {
    console.log(' * Teller NFT already initialized')
  }

  console.log()
  console.log('  ** Adding Tiers to Teller NFT **')
  console.log()

  for (let index = 0; index < tiers.length; index++) {
    const tier = await nft.tiers(index)
    if (tier.contributionAsset === NULL_ADDRESS) {
      await nft.addTier(tiers[index])

      console.log(` * Tier ${index} added`)
    } else {
      console.log(` * Tier ${index} already exists`)
    }
  }

  console.log()
  console.log('  ** Adding Merkle Roots to NFT Distributor **')
  console.log()

  for (let index = 0; index < distributions.length; index++) {
    const merkleRoots = await nftDistributor.getTierMerkleRoots()
    if (merkleRoots.length === 0) {
      await nftDistributor.addTier(distributions[index].merkleRoot)
      console.log(` * Merkle root for tier ${index} added to distributor`)
    } else {
      console.log(
        ` * Merkle root for tier ${index} already added to distributor`
      )
    }
  }

  fs.writeFileSync(output, JSON.stringify(distributions, null, 2))

  console.log(` ** Output written to ${output}`)
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
