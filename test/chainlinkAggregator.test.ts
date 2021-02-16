import { Signer } from '@ethersproject/abstract-signer'
import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { ChainlinkAggregator } from '../types/typechain'
import { getMarket } from '../tasks'
import { Address } from '../types/custom/config-types'
import { ETH_ADDRESS } from '../consts'

chai.should()
chai.use(chaiAsPromised)

const { deployments, ethers, contracts, getNamedSigner } = hre

describe('Chainlink Aggregator', async () => {
  let chainlinkAggregator: ChainlinkAggregator
  let deployer: Signer
  let sourceTokenAddress: Address
  let destinationTokenAddress: Address
  let aggregatorAddressToAdd: Address

  // Setup for global tests
  beforeEach(async () => {
    deployer = await getNamedSigner('deployer')
  })

  describe('Add an additional chainlink aggregator', () => {
    // Setup for snapshot tests
    beforeEach(async () => {
      // Get snapshot
      await deployments.fixture('chainlink')
      chainlinkAggregator = await contracts.get('ChainlinkAggregator', { from: deployer })

      // Set up addresses
      sourceTokenAddress = '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' // AAVE
      destinationTokenAddress = ETH_ADDRESS // ETH
      aggregatorAddressToAdd = '0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012' // AAVE<>ETH
    })

    it('Should be able add an aggregator address a pauser', async () => {
      // Add aggregator
      await chainlinkAggregator.add(sourceTokenAddress, destinationTokenAddress, aggregatorAddressToAdd)

      // Check if aggregator was successfully added
      const aggregatorResponse: [string, boolean] = await chainlinkAggregator.aggregatorFor(
        sourceTokenAddress,
        destinationTokenAddress
      )

      const tokenSupportResponse = await chainlinkAggregator.isTokenSupported(sourceTokenAddress)

      aggregatorResponse[0].should.be.equals(aggregatorAddressToAdd)
      tokenSupportResponse.should.be.equals(true)
    })

    it('Should not be able to add an aggregator as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () =>
        chainlinkAggregator.connect(notPauser).add(sourceTokenAddress, destinationTokenAddress, aggregatorAddressToAdd)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Remove a chainlink aggregator', () => {
    // Setup for snapshot tests
    beforeEach(async () => {
      // Get snapshot
      await deployments.fixture('chainlink')
      chainlinkAggregator = await contracts.get('ChainlinkAggregator', { from: deployer })

      // Set up addresses
      sourceTokenAddress = '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' // AAVE
      destinationTokenAddress = ETH_ADDRESS // ETH
      aggregatorAddressToAdd = '0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012' // AAVE<>ETH

      // Add aggregator
      await chainlinkAggregator.add(sourceTokenAddress, destinationTokenAddress, aggregatorAddressToAdd)
    })

    it('Should be able remove an aggregator address a pauser', async () => {
      // Add aggregator
      await chainlinkAggregator['remove(address)'](sourceTokenAddress)

      // Check if aggregator was successfully removed
      const tokenSupportResponse = await chainlinkAggregator.isTokenSupported(sourceTokenAddress)

      tokenSupportResponse.should.be.equals(false)
    })

    it('Should not be able to remove an aggregator as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () => chainlinkAggregator.connect(notPauser)['remove(address)'](sourceTokenAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('Retrieve price for a token pair', () => {
    // Setup for snapshot tests
    beforeEach(async () => {
      // Get snapshot
      await deployments.fixture('chainlink')
      chainlinkAggregator = await contracts.get('ChainlinkAggregator', { from: deployer })

      // Set up addresses
      sourceTokenAddress = '0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9' // AAVE
      destinationTokenAddress = ETH_ADDRESS // ETH
      aggregatorAddressToAdd = '0x6Df09E975c830ECae5bd4eD9d90f3A95a4f88012' // AAVE<>ETH

      // Add aggregator
      await chainlinkAggregator.add(sourceTokenAddress, destinationTokenAddress, aggregatorAddressToAdd)
    })

    it('Should be able get the latest price of a token pair', async () => {
      // Add aggregator
      const fn = () => chainlinkAggregator.latestAnswerFor(sourceTokenAddress, destinationTokenAddress)

      await fn().should.be.fulfilled
    })
  })
})
