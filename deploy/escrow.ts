import { deployments, getNamedSigner } from 'hardhat'
import { DeployFunction } from 'hardhat-deploy/dist/types'

const escrow: DeployFunction = async () => {
  const deployer = await getNamedSigner('deployer')
  const from = await deployer.getAddress()

  await deployments.deploy('EscrowContext', {
    from,
  })
}
