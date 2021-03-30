import { DeployFunction } from 'hardhat-deploy/types'

import { DappRegistry } from '../types/typechain/DappRegistry'
import { deployDynamicProxy } from '../utils/deploy-helpers'

type DappDeploymentData = Array<{
  contract: string
  unsecured: boolean
}>

const deployDapps: DeployFunction = async (hre) => {
  const { getNamedAccounts, contracts } = hre
  const { deployer } = await getNamedAccounts()

  console.log('********** Dapps **********')
  console.log()

  const dappData: DappDeploymentData = [
    {
      contract: 'UniswapDapp',
      unsecured: false,
    },
    {
      contract: 'CompoundDapp',
      unsecured: true,
    },
    {
      contract: 'AaveDapp',
      unsecured: true,
    },
    {
      contract: 'YearnDapp',
      unsecured: true,
    },
    {
      contract: 'PoolTogetherDapp',
      unsecured: true,
    },
  ]
  const dappRegistry = await contracts.get<DappRegistry>('DappRegistry', {
    from: deployer,
  })

  for (const data of dappData) {
    const { address } = await deployDynamicProxy({
      hre,
      contract: data.contract,
      strictDynamic: false,
    })

    // Check if the dapp is already registered
    const { exists } = await dappRegistry.dapps(address)
    if (exists) {
      console.log(`  * ${data.contract} Dapp already registered... \n`)
    } else {
      process.stdout.write(`  * Registering ${data.contract} Dapp...: `)

      const receipt = await dappRegistry
        .addDapp(address, data.unsecured)
        .then(({ wait }) => wait())

      process.stdout.write(`registered with ${receipt.gasUsed} gas \n`)
    }
  }

  console.log()
}

export default deployDapps

deployDapps.tags = ['dapps']
deployDapps.dependencies = ['settings']
