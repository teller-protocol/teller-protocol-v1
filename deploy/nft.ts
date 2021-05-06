import { DeployFunction } from 'hardhat-deploy/types'

import { ITellerNFT, ITellerNFTDistributor } from '../types/typechain'
import { deploy, deployDiamond } from '../utils/deploy-helpers'

const deployNFT: DeployFunction = async (hre) => {
  const { getNamedSigner, run, log } = hre

  const deployer = await getNamedSigner('deployer')

  // Make sure contracts are compiled
  await run('compile')

  log('')
  log('********** Teller NFT **********', { indent: 1 })
  log('')

  const nft = await deploy<ITellerNFT>({
    contract: 'TellerNFT',
    hre,
  })

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
  })

  log('')
  log('Initializing Teller NFT', { indent: 2, star: true })
  log('')

  try {
    const minters: string[] = [
      nftDistributor.address,
      await deployer.getAddress(),
    ]
    await nft.initialize(minters).then(async ({ wait }) => await wait())
    log('Teller NFT initialized', { indent: 3, star: true })
  } catch (err) {
    log('Teller NFT already initialized', { indent: 3, star: true })
  }

  await run('add-nft-tiers', { sendTx: true })
  await run('add-nft-merkles', { sendTx: true })
}

deployNFT.tags = ['nft']

export default deployNFT
