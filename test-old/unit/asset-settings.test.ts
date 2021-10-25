// import chai from 'chai'
// import { solidity, deployMockContract } from 'ethereum-waffle'
// import hre from 'hardhat'
// import {
//   createAndGetLoan,
//   createLoan,
//   fundedMarket,
//   MarketReturn,
// } from '../../test-old/fixtures'
// import { BigNumberish, Signer } from 'ethers'
// import { AssetSettings, Settings } from '../../types/typechain'
// import { ERC20 } from '@chainlink/contracts/ethers/v0.4/ERC20'
// import { Address } from 'hardhat-deploy/dist/types'
//
// chai.should()
// chai.use(solidity)
//
// const { deployments, getNamedSigner, contracts, ethers, fastForward } = hre
//
// const setupTest = deployments.createFixture(async () => {
//   await deployments.fixture('markets')
//
//   const deployer = await getNamedSigner('deployer')
//
//   // Load settings contract
//   const settings = await contracts.get<Settings>('Settings', { from: deployer })
//
//   // Fund market
//   const market = await fundedMarket()
//
//   return {
//     market,
//     settings,
//   }
// })
//
// describe('Settings', async () => {
//   let market: MarketReturn
//   let settings: Settings
//   let borrower: Signer
//   let borrowerAddress: string
//   let deployer: Signer
//   let newPauserAddress: string
//
//   // Setup for global tests
//   beforeEach(async () => {
//     // Execute snapshot and setup for tests
//     ;({ market, settings } = await setupTest())
//     borrower = await getNamedSigner('borrower')
//     borrowerAddress = await borrower.getAddress()
//     deployer = await getNamedSigner('deployer')
//     newPauserAddress = (await ethers.getSigners())[3].address
//   })
//
//   describe('pauseLendingPool', () => {
//     // Pause a lendingPool and try to take out a loan
//     it('should not be able to take out a loan after platform being paused', async function () {
//       // Pauser lendingPool as deployer
//       ;(
//         await settings
//           .connect(deployer)
//           .pauseLendingPool(market.lendingPool.address)
//       ).should
//         .emit(settings, 'LendingPoolPaused')
//         .withArgs(await deployer.getAddress(), market.lendingPool.address)
//       // Try to take out loan as a borrower
//       const fn = () => createAndGetLoan(market, borrower, 2, hre)
//       await fn().should.be.revertedWith('LENDING_POOL_IS_PAUSED')
//     })
//     it('should not be able to pause the lending pool as not a pauser', async function () {
//       // Try to pause the lending pool
//       await settings
//         .connect(borrower)
//         .pauseLendingPool(market.lendingPool.address)
//         .should.be.revertedWith('NOT_PAUSER')
//     })
//   })
//
//   describe('createAssetSetting', () => {
//     let assetSettings: AssetSettings
//     let newAssetAddress: Address
//     let lendingTokenAddress: string
//     let currentMaxLoanSetting: BigNumberish
//     let newCtokenAddress: Address
//     let newMaxLoan: number
//     let newMaxTVL: number
//     let newMaxDebt: number
//     let updateValue: number
//
//     before(async () => {
//       // Get asset setting contract from settings
//       assetSettings = await contracts.get('AssetSettings')
//       // Get the current lending asset for the deployed market
//       lendingTokenAddress = await market.lendingPool.lendingToken()
//       // Get current max loan amount for the lending asset
//       currentMaxLoanSetting = await assetSettings.getMaxLoanAmount(
//         lendingTokenAddress
//       )
//
//       newAssetAddress = ethers.utils.getAddress(
//         '0xdAC17F958D2ee523a2206206994597C13D831ec7'
//       ) // USDT
//       newCtokenAddress = ethers.utils.getAddress(
//         '0xf650c3d88d12db855b8bf7d11be6c55a4e07dcc9'
//       ) // CUSDT
//
//       // Set values
//       newMaxLoan = 8000
//       newMaxTVL = 250000
//       newMaxDebt = 4000
//       updateValue = 2021
//     })
//     it('update the max loan for an asset and try to take out a loan above it', async function () {
//       // Update setting
//       await assetSettings
//         .connect(deployer)
//         .updateMaxLoanAmount(lendingTokenAddress, updateValue)
//         .should.emit(assetSettings, 'AssetSettingsUintUpdated')
//         .withArgs(
//           ethers.utils.id('MaxLoanAmount'),
//           await deployer.getAddress(),
//           lendingTokenAddress,
//           currentMaxLoanSetting,
//           updateValue
//         )
//       // Try to create loan exceeding new max setting
//       await createLoan(market, 2, '3000', borrower).should.be.revertedWith(
//         'AMOUNT_EXCEEDS_MAX_AMOUNT'
//       )
//     })
//     it('should be able to add/update an asset setting as a pauser', async function () {
//       // Create new setting
//       await assetSettings
//         .connect(deployer)
//         .createAssetSetting(
//           newAssetAddress,
//           newCtokenAddress,
//           newMaxLoan,
//           newMaxTVL,
//           newMaxDebt
//         )
//         .should.emit(assetSettings, 'AssetSettingsCreated')
//         .withArgs(
//           await deployer.getAddress(),
//           newAssetAddress,
//           newCtokenAddress,
//           newMaxLoan
//         )
//       await fastForward(50000)
//       // Update setting
//       await assetSettings
//         .connect(deployer)
//         .updateMaxLoanAmount(newAssetAddress, updateValue)
//         .should.emit(assetSettings, 'AssetSettingsUintUpdated')
//         .withArgs(
//           ethers.utils.id('MaxLoanAmount'),
//           await deployer.getAddress(),
//           newAssetAddress,
//           newMaxLoan,
//           updateValue
//         )
//     })
//     it('should not be able to add/update an asset setting as not a pauser', async function () {
//       // Try to create new setting
//       await assetSettings
//         .connect(borrower)
//         .createAssetSetting(
//           newAssetAddress,
//           newCtokenAddress,
//           newMaxLoan,
//           newMaxTVL,
//           newMaxDebt
//         )
//         .should.be.revertedWith('NOT_PAUSER')
//       // Try to update setting
//       await assetSettings
//         .connect(borrower)
//         .updateMaxLoanAmount(newAssetAddress, updateValue)
//         .should.be.revertedWith('NOT_PAUSER')
//     })
//   })
//
//   describe('createPlatformSetting', () => {
//     const newPlatformSettingName = ethers.utils.id('LiquidateLinkPrice')
//     const newSettingValue = 8800
//     const updateSettingValue = 8000
//     const minValue = 0
//     const maxValue = 1234567890
//     it('should be able to add/update a platform setting as a pauser', async function () {
//       // Create new setting
//       await settings
//         .connect(deployer)
//         .createPlatformSetting(
//           newPlatformSettingName,
//           newSettingValue,
//           minValue,
//           maxValue
//         )
//         .should.emit(settings, 'PlatformSettingCreated')
//         .withArgs(
//           newPlatformSettingName,
//           await deployer.getAddress(),
//           newSettingValue,
//           minValue,
//           maxValue
//         )
//       // Update setting
//       await settings
//         .connect(deployer)
//         .updatePlatformSetting(newPlatformSettingName, updateSettingValue)
//         .should.emit(settings, 'PlatformSettingUpdated')
//         .withArgs(
//           newPlatformSettingName,
//           await deployer.getAddress(),
//           newSettingValue,
//           updateSettingValue
//         )
//     })
//     it('should not be able to add/update a platform setting as not a pauser', async function () {
//       // Try to create a setting
//       await settings
//         .connect(borrower)
//         .createPlatformSetting(
//           newPlatformSettingName,
//           newSettingValue,
//           minValue,
//           maxValue
//         )
//         .should.be.revertedWith('NOT_PAUSER')
//       // Try to update a setting
//       await settings
//         .connect(borrower)
//         .updatePlatformSetting(newPlatformSettingName, updateSettingValue)
//         .should.be.revertedWith('NOT_PAUSER')
//     })
//   })
// })
