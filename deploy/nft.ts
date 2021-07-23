import colors from 'colors'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { DeployFunction } from 'hardhat-deploy/types'

import { getNetworkName } from '../config'
import {
  ITellerNFT,
  ITellerNFTDistributor,
  MainnetTellerNFT,
} from '../types/typechain'
import { TellerNFTDictionary } from '../types/typechain'
import {
  deploy,
  deployDiamond,
  DeployDiamondArgs,
} from '../utils/deploy-helpers'

const deployNFT: DeployFunction = async (hre) => {
  const { getNamedSigner, run, log, network, contracts, ethers } = hre
  const deployer = await getNamedSigner('deployer')
  const networkName = getNetworkName(network)
  // Make sure contracts are compiled
  await run('compile')

  log('')
  log('********** Teller NFT **********', { indent: 1 })
  log('')

  // Store list of addresses that should be added as minters
  const nftName = 'TellerNFT_V2'
  const isEthereum = ['mainnet', 'kovan', 'rinkeby', 'ropsten'].some(
    (n) => n === networkName
  )
  if (isEthereum) {
    const nft = await deploy<MainnetTellerNFT>({
      contract: 'MainnetTellerNFT',
      name: nftName,
      hre,
      proxy: {
        proxyContract: 'OpenZeppelinTransparentProxy',
        execute: {
          init: {
            methodName: 'initialize',
            args: [
              // Initial minters
              [await deployer.getAddress()],
            ],
          },
        },
      },
    })

    // Deploy distributor
    const nftDistributor = await deployDistributor(hre)

    // Add the distributor as a minter if not already
    const minterRole = ethers.utils.id('MINTER')
    const distributorIsDictAdmin = await nft.hasRole(
      minterRole,
      nftDistributor.address
    )
    if (!distributorIsDictAdmin) {
      log(
        `Adding distributor (${nftDistributor.address}) as MINTER for TellerNFT...: `,
        { indent: 2, star: true, nl: false }
      )

      const receipt = await nft
        .connect(deployer)
        .grantRole(minterRole, nftDistributor.address)
        .then(({ wait }) => wait())

      log(` with ${colors.cyan(receipt.gasUsed.toString())} gas`)
    }
  } else {
    await deploy({
      contract: 'PolyTellerNFT',
      name: nftName,
      hre,
      proxy: {
        proxyContract: 'OpenZeppelinTransparentProxy',
        execute: {
          init: {
            methodName: 'initialize',
            args: [[]],
          },
        },
      },
    })
  }

  await run('add-nft-tiers', { sendTx: true })
  await run('add-nft-merkles', { sendTx: true })
}

const deployDistributor = async (
  hre: HardhatRuntimeEnvironment
): Promise<ITellerNFTDistributor> => {
  const { ethers, contracts, getNamedSigner, log } = hre

  const deployer = await getNamedSigner('deployer')

  const nft = await contracts.get<ITellerNFT>('TellerNFT')

  let execute: DeployDiamondArgs<ITellerNFTDistributor, any>['execute']
  try {
    // Try to get deployment of TellerDiamond
    await contracts.get('TellerNFTDistributor')

    // If deployment exists execute upgrade function
    const executeMethod = undefined
    const upgradeExecute: DeployDiamondArgs<
      ITellerNFTDistributor,
      typeof executeMethod
    >['execute'] = undefined

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

  return nftDistributor
}

deployNFT.tags = ['nft']
deployNFT.dependencies = ['setup']

export default deployNFT
