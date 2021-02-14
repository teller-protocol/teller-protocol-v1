import { DeployFunction } from 'hardhat-deploy/dist/types'
import { EscrowFactory } from '../types/typechain'

const addDapps: DeployFunction = async (hre) => {
  const { getNamedAccounts, deployments, contracts } = hre
  const { deployer } = await getNamedAccounts()

  const uniswap = await deployments.get('Uniswap')
  const compound = await deployments.get('Compound')

  const escrowFactory = await contracts.get<EscrowFactory>('EscrowFactory', { from: deployer })

  await escrowFactory.addDapp(uniswap.address, false)
  await escrowFactory.addDapp(compound.address, true)
}

addDapps.tags = [ 'dapps' ]
addDapps.dependencies = [ 'settings' ]

export default addDapps
