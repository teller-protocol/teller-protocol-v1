import chai from 'chai'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { getPlatformSettings } from '../../config'
import { ITellerDiamond } from '../../types/typechain'
import { RUN_EXISTING } from '../helpers/env-helpers'
chai.should()

const { contracts, deployments, getNamedSigner, ethers, network } = hre

describe.skip('Platform Settings', () => {
  const platformSettings = getPlatformSettings(network)
  const settingNames = Object.keys(platformSettings) as Array<
    keyof typeof platformSettings
  >

  let diamond: ITellerDiamond
  let deployer: Signer

  before(async () => {
    diamond = await contracts.get<ITellerDiamond>('TellerDiamond')
    deployer = await getNamedSigner('deployer')
  })

  describe('updatePlatformSetting', () => {
    beforeEach(async () => {
      await deployments.fixture('platform-settings', {
        keepExistingDeployments: RUN_EXISTING,
      })
    })

    for (const settingName of settingNames) {
      it('should not be able to update a platform setting as not an admin', async () => {
        const nameId = ethers.id(settingName)
        const setting = platformSettings[settingName]

        const newValue = BigInt(setting.value) / 2n

        const lender = await getNamedSigner('lender')

        // Try to update a setting
        await diamond
          .connect(lender)
          .updatePlatformSetting(nameId, newValue)
          .should.be.revertedWith('AccessControl: not authorized')
      })
    }

    for (const settingName of settingNames) {
      it('should be able to update a platform setting as an admin', async () => {
        const nameId = ethers.id(settingName)
        const setting = platformSettings[settingName]

        const newValue = BigInt(setting.value) / 2n

        // Update setting
        await diamond
          .connect(deployer)
          .updatePlatformSetting(nameId, newValue)
          .should.emit(diamond, 'PlatformSettingUpdated')
          .withArgs(
            nameId,
            await deployer.getAddress(),
            setting.value,
            newValue
          )
      })
    }

    for (const settingName of settingNames) {
      it('should not be able to update a platform setting with the same value', async () => {
        const nameId = ethers.id(settingName)
        const setting = platformSettings[settingName]

        const newValue = BigInt(setting.value)

        // Try to update a setting
        await diamond
          .connect(deployer)
          .updatePlatformSetting(nameId, newValue)
          .should.be.revertedWith('Teller: new platform setting not different')
      })
    }

    for (const settingName of settingNames) {
      it('should not be able to update a platform setting above the max value', async () => {
        const nameId = ethers.id(settingName)
        const setting = platformSettings[settingName]

        const newValue = BigInt(setting.max) + 1n

        // Update setting
        await diamond
          .connect(deployer)
          .updatePlatformSetting(nameId, newValue)
          .should.be.revertedWith(
            'Teller: new platform setting greater than max'
          )
      })
    }

    for (const settingName of settingNames) {
      it('should not be able to update a platform setting below the min value', async () => {
        const nameId = ethers.id(settingName)
        const setting = platformSettings[settingName]

        const newValue = BigInt(setting.min) - 1n

        // Update setting
        await diamond
          .connect(deployer)
          .updatePlatformSetting(nameId, newValue)
          .should.be.revertedWith('Teller: new platform setting less than min')
      })
    }
  })
})
