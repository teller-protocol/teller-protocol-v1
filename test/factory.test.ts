import { Signer } from 'ethers'
import { deployments, getNamedSigner } from 'hardhat'

// const setup = deployments.createFixture(async () => {

// })

describe('Factory', () => {
  let deployer: Signer
  let from: string

  before(async () => {
    const deployer = await getNamedSigner('deployer')
    const from = await deployer.getAddress()
  })
  describe('Used as a facet', () => {})
  describe('Used externally', () => {
    let factory: EscrowFactory
    before(async () => {
      const { address: factoryAddress } = await deployments.deploy(
        'EscrowFactory',
        {
          from,
        }
      )
    })
    it('Correctly creates an implementation', async () => {})
    it('Correctly destroys an implementation', async () => {})
    it('Correctly deploys a proxy', async () => {})
    it('Correctly upgrades all proxies at once', async () => {})
  })
  describe('Used maliciously', () => {})
})
