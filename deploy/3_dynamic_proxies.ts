import { formatBytes32String } from 'ethers/lib/utils'
import { ethers } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/dist/types'

const deployDynamicProxies: DeployFunction = async (hre) => {
  const { deployments, getNamedAccounts } = hre
  const { deployer } = await getNamedAccounts()

  const proxyContracts = [
    {
      identifier: 'Uniswap_Proxy',
      contractName: 'DynamicProxy',
      logicName: 'Uniswap'
    },
    {
      identifier: 'Compound_Proxy',
      contractName: 'DynamicProxy',
      logicName: 'Uniswap'
    }
  ]

  const { address: settingsAddress } = await deployments.get('Settings')

  for (const { identifier, contractName, logicName } of proxyContracts) {
    const instanceIdentifier = identifier.split('_Proxy')[0]
    const proxyDeployment = await deployments.deploy(identifier, {
      from: deployer,
      contract: contractName,
      args: [ settingsAddress, ethers.utils.solidityKeccak256([ 'bytes32' ], [ formatBytes32String(logicName) ]) ]
    })
    const { abi } = await deployments.getArtifact(instanceIdentifier)
    await deployments.save(instanceIdentifier, {
      abi,
      address: proxyDeployment.address
    })
  }
}

export default deployDynamicProxies

deployDynamicProxies.tags = [ 'dynamic-proxies' ]
deployDynamicProxies.dependencies = [ 'logic' ]
