import { DeployFunction } from 'hardhat-deploy/types'

import { ITellerNFT, ITellerNFTDistributor } from '../types/typechain'
import { TellerNFTDictionary } from '../types/typechain/TellerNFTDictionary'
import {
  deploy,
  deployDiamond,
  DeployDiamondArgs,
} from '../utils/deploy-helpers'

const deployNFT: DeployFunction = async (hre) => {
  const { getNamedSigner, run, log, contracts } = hre
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

  /** TODO */

  let proxyMethodName: string | undefined
  let proxyMethodArgs: Array<any> | undefined

  try {
    // Try to get deployment of TellerDiamond
    await contracts.get('TellerNFTDictionary')

    proxyMethodName = undefined
    proxyMethodArgs = undefined
  } catch (e) {
    proxyMethodName = 'initialize' //call this method on deployment
    proxyMethodArgs = [await deployer.getAddress()]
  }

  console.log(`deploying dictionary with methodname ${proxyMethodName}`)

  const nftDictionary = await deploy<TellerNFTDictionary>({
    contract: 'TellerNFTDictionary',
    hre,

    proxy: {
      proxyContract: 'OpenZeppelinTransparentProxy',
      methodName: proxyMethodName,
    },
    args: proxyMethodArgs,
  })

  //call initialize on the dictionary

  let execute: DeployDiamondArgs<ITellerNFTDistributor, any>['execute']
  try {
    // Try to get deployment of TellerDiamond
    await contracts.get('TellerNFTDistributor')

    console.log('execute setNFTDictionaryAddress on TellerNFTDistributor ')

    // If deployment exists execute upgrade function
    const executeMethod = 'setNFTDictionaryAddress'
    const upgradeExecute: DeployDiamondArgs<
      ITellerNFTDistributor,
      typeof executeMethod
    >['execute'] = {
      methodName: executeMethod,
      args: [nftDictionary.address],
    }

    execute = upgradeExecute
  } catch {
    const executeMethod = 'initialize'
    const initExecute: DeployDiamondArgs<
      ITellerNFTDistributor,
      typeof executeMethod
    >['execute'] = {
      methodName: executeMethod,
      args: [nft.address, await deployer.getAddress()],
    }

    execute = initExecute
  }

  const nftDistributor = await deployDiamond<ITellerNFTDistributor, any>({
    name: 'TellerNFTDistributor',
    facets: [
      {
        contract: 'ent_initialize_NFTDistributor_v1',
        skipIfAlreadyDeployed: true,
      },
      {
        contract: 'ent_addMerkle_NFTDistributor_v1',
        skipIfAlreadyDeployed: true,
      },
      {
        contract: 'ent_moveMerkle_NFTDistributor_v1',
        skipIfAlreadyDeployed: true,
      },
      { contract: 'ent_claim_NFTDistributor_v1', skipIfAlreadyDeployed: false },
      { contract: 'ext_distributor_NFT_v1', skipIfAlreadyDeployed: true },
    ],
    hre,
    execute,
  })

  log(
    `Adding distributor ${await deployer.getAddress()} as ADMIN for Dictionary...: `,
    { indent: 2, star: true, nl: false }
  )

  await nftDistributor
    .connect(deployer)
    .setNFTDictionaryAddress(nftDictionary.address)
    .then(({ wait }) => wait())

  await nftDictionary
    .connect(deployer)
    .grantRole(ethers.utils.id('ADMIN'), nftDistributor.address)
    .then(({ wait }) => wait())

  log('Done.')

  log('Initializing Teller NFT...:', { indent: 2, star: true, nl: false })

  try {
    const minters: string[] = [
      nftDistributor.address,
      await deployer.getAddress(),
    ]
    const receipt = await nft
      .initialize(minters)
      .then(async ({ wait }) => await wait())
    log(` with ${receipt.gasUsed} gas`)
  } catch (err) {
    log(' already initialized')
  }

  await run('add-nft-tiers', { sendTx: true })
  await run('add-nft-merkles', { sendTx: true })
}

deployNFT.tags = ['nft']
deployNFT.dependencies = ['setup']

export default deployNFT
