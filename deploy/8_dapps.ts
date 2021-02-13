import { DeployFunction } from 'hardhat-deploy/dist/types'

const addDapps: DeployFunction = async ({ getNamedAccounts, deployments }) => {
  const { deployer } = await getNamedAccounts()

  const uniswap = await deployments.get('Uniswap')
  const compound = await deployments.get('Compound')

  await deployments.execute('EscrowFactory', { from: deployer }, 'addDapp', uniswap.address, false)
  await deployments.execute('EscrowFactory', { from: deployer }, 'addDapp', compound.address, true)
}

addDapps.tags = [ 'dapps' ]
addDapps.dependencies = [ 'settings' ]

export default addDapps
