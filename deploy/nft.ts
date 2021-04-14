import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { ITellerNFT, ITellerNFTDistributor } from '../types/typechain'
import { deploy, deployDiamond } from '../utils/deploy-helpers'

const deployNFT: DeployFunction = async (hre) => {
  const { getNamedSigner, run } = hre

  const deployer = await getNamedSigner('deployer')

  // Make sure contracts are compiled
  await run('compile')

  const nft = await getOrDeployNFT(hre)
  const nftDistributor = await getOrDeployNFTDistributor(hre, nft)

  console.log()
  console.log('  ** Initializing Teller NFT **')
  console.log()

  try {
    const minters: string[] = [
      nftDistributor.address,
      await deployer.getAddress(),
    ]
    await nft.initialize(minters).then(async ({ wait }) => await wait())
    console.log(' * Teller NFT initialized')
  } catch (err) {
    const message = err?.error?.message ?? err?.message ?? ''
    if (message.includes('already initialized')) {
      console.log(' * Teller NFT already initialized')
    } else {
      throw err
    }
  }

  await run('add-nft-tiers', { sendTx: true })
  await run('add-nft-merkles', { sendTx: true })
}

const getOrDeployNFT = async (
  hre: HardhatRuntimeEnvironment
): Promise<ITellerNFT> => {
  const { contracts, getNamedSigner } = hre

  console.log()
  console.log('  ** Deploying Teller NFT **')
  console.log()

  let nft = await contracts.get<ITellerNFT>('TellerNFT')
  if (nft == null) {
    nft = await deploy<ITellerNFT>({
      contract: 'TellerNFT',
      hre,
    })
  } else {
    console.log(`    ** Teller NFT already deployed: ${nft.address}`)
  }

  console.log()

  return nft.connect(await getNamedSigner('deployer'))
}

const getOrDeployNFTDistributor = async (
  hre: HardhatRuntimeEnvironment,
  nft: ITellerNFT
): Promise<ITellerNFTDistributor> => {
  const { contracts, getNamedSigner } = hre

  const deployer = await getNamedSigner('deployer')

  console.log()
  console.log('  ** Deploying Teller NFT Distributor **')
  console.log()

  let nftDistributor = await contracts.get<ITellerNFTDistributor>(
    'TellerNFTDistributor'
  )
  if (nftDistributor == null) {
    nftDistributor = await deployDiamond<ITellerNFTDistributor>({
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
    })
  } else {
    console.log(
      `    ** Teller NFT Distributor already deployed: ${nftDistributor.address}`
    )
  }

  console.log()

  return nftDistributor.connect(deployer)
}

deployNFT.tags = ['nft']

export default deployNFT
