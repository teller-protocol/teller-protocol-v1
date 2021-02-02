import { assert } from 'chai'
import { deployments } from 'hardhat'
import { EscrowFactory, LoanTermsConsensus, Settings } from '../types/typechain'

export const setup = deployments.createFixture(async ({ deployments, getNamedAccounts, ethers }, options) => {
  // ensure to start from fresh test-tagged deployment functions execution
  await deployments.fixture(['test'])
  const settings_ProxyDeployment = await deployments.get('Settings_Proxy')
  const { deployer, user1 } = await getNamedAccounts()
  const settings = (await ethers.getContractAt('Settings', settings_ProxyDeployment.address)) as Settings

  return {
    settings,
    accounts: {
      deployer,
    },
  }
})

describe('Token', () => {
  it('testing 1 2 3', async function () {
    const { accounts, settings } = await setup()
    const result = await settings.isPaused()
    assert(result == false)
  })
})
