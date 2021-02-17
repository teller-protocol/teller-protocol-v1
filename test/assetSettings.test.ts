import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { AssetSettings } from '../types/typechain'
import { getMarket } from '../tasks'
import { Address } from '../types/custom/config-types'

chai.should()
chai.use(chaiAsPromised)

const { deployments, ethers, contracts, getNamedSigner } = hre

const setupTest = deployments.createFixture(async () => {
  // Get snapshot
  await deployments.fixture('markets')

  const deployer = await getNamedSigner('deployer')
  const assetSettings = await contracts.get<AssetSettings>('AssetSettings', { from: deployer })

  // Get asset addresses from lending pool
  const { lendingPool } = await getMarket(
    {
      lendTokenSym: 'DAI',
      collTokenSym: 'ETH',
    },
    hre
  )
  const assetAddress = await lendingPool.lendingToken()
  const cTokenAddress = await lendingPool.cToken()

  return {
    assetSettings,
    assetAddress,
    cTokenAddress,
  }
})

describe('AssetSettings', async () => {
  let assetSettings: AssetSettings
  let assetAddress: Address
  let cTokenAddress: Address
  let emptyAddress = '0x0000000000000000000000000000000000000000'
  let maxLoan = 1000
  let maxTVL = 100000
  let maxDebtRatio = 5000

  // Setup for global tests
  beforeEach(async () => {
    // Execute snapshot and setup for tests
    const setup = await setupTest()

    assetSettings = setup.assetSettings
    assetAddress = setup.assetAddress
    cTokenAddress = setup.cTokenAddress
  })

  describe('Create asset setting', () => {
    it('Should not be able to create an asset setting that has been created on deployment as a pauser', async () => {
      // Create asset setting
      const fn = () => assetSettings.createAssetSetting(assetAddress, cTokenAddress, maxLoan, maxTVL, maxDebtRatio)

      await fn().should.be.rejectedWith('CACHE_ALREADY_EXISTS')
    })

    it('Should be able to create an asset setting that has not been created on deployment as a pauser', async () => {
      // Create asset setting
      const fn = () => assetSettings.createAssetSetting(cTokenAddress, assetAddress, maxLoan, maxTVL, maxDebtRatio)

      await fn().should.be.fulfilled
    })

    it('Should not be able to create an asset setting as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to create asset setting
      const fn = () =>
        assetSettings.connect(notPauser).createAssetSetting(assetAddress, cTokenAddress, maxLoan, maxTVL, maxDebtRatio)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })

    it('Should not be able to create an asset setting with an empty cToken address', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to create asset setting
      const fn = () => assetSettings.createAssetSetting(assetAddress, emptyAddress, maxLoan, maxTVL, maxDebtRatio)

      await fn().should.be.rejectedWith('CTOKEN_ADDRESS_REQUIRED')
    })

    it('Should not be able to create an asset setting with an empty cToken address', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to create asset setting
      const fn = () => assetSettings.createAssetSetting(emptyAddress, cTokenAddress, maxLoan, maxTVL, maxDebtRatio)

      await fn().should.be.rejectedWith('ASSET_ADDRESS_REQUIRED')
    })
  })

  describe('Update max loan amount', () => {
    it('Should be able to update the max loan amount for an asset as a pauser', async () => {
      // Create asset setting
      const fn = () => assetSettings.updateMaxLoanAmount(assetAddress, 6520)

      await fn().should.be.fulfilled
    })

    it('Should not be able to update the max loan amount for an asset as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to create asset setting
      const fn = () => assetSettings.connect(notPauser).updateMaxLoanAmount(assetAddress, 64000)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Update cToken address', () => {
    let newCTokenAddress = '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9'

    it('Should be able to update the cToken address for an asset as a pauser', async () => {
      // Create asset setting
      const fn = () => assetSettings.updateCTokenAddress(assetAddress, newCTokenAddress)

      await fn().should.be.fulfilled
    })

    it('Should not be able to update the cToken address for an asset as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to create asset setting
      const fn = () => assetSettings.connect(notPauser).updateCTokenAddress(assetAddress, newCTokenAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Remove asset', () => {
    it.skip('Should be able to remove an asset as a pauser', async () => {
      // Create asset setting
      const ting = await assetSettings.removeAsset(assetAddress)
      console.log({ ting })
      const result = await assetSettings.getCTokenAddress(assetAddress)

      result.should.equal(emptyAddress)
    })

    it('Should not be able to remove an asset as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to create asset setting
      const fn = () => assetSettings.connect(notPauser).removeAsset(assetAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })
})
