import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { ChainlinkAggregator } from '../../types/typechain'
import { Network } from '../../types/custom/config-types'
import { getTokens } from '../../config/tokens'
import { getChainlink } from '../../config/chainlink'
import { NULL_ADDRESS } from '../../utils/consts'

chai.should()
chai.use(chaiAsPromised)

const { deployments, ethers, contracts, getNamedSigner } = hre

const setupTest = deployments.createFixture(async () => {
  // Get snapshot
  await deployments.fixture('asset-settings')

  const deployer = await getNamedSigner('deployer')
  const chainlinkAggregator = await contracts.get<ChainlinkAggregator>(
    'ChainlinkAggregator',
    { from: deployer }
  )

  return {
    chainlinkAggregator,
  }
})

describe('Chainlink Aggregator', async () => {
  let chainlinkAggregator: ChainlinkAggregator
  const chainlink = getChainlink(<Network>hre.network.name)
  const tokens = getTokens(<Network>hre.network.name)

  // Setup for global tests
  beforeEach(async () => {
    const setup = await setupTest()

    chainlinkAggregator = setup.chainlinkAggregator
  })

  describe('add', () => {
    const srcTokenAddress = '0x111111111117dc0aa78b770fa6a738034120c302' // 1INCH
    const dstTokenAddress = tokens.ETH // ETH
    const aggregatorAddressToAdd = '0x72AFAECF99C9d9C8215fF44C77B94B99C28741e8' // 1INCH<>ETH

    it('Should be able add an aggregator address as a pauser', async () => {
      // Add aggregator
      await chainlinkAggregator.add(
        srcTokenAddress,
        dstTokenAddress,
        aggregatorAddressToAdd
      )

      // Check if aggregator was successfully added
      const aggregatorResponse: [
        string,
        boolean
      ] = await chainlinkAggregator.aggregatorFor(
        srcTokenAddress,
        dstTokenAddress
      )

      const tokenSupportResponse = await chainlinkAggregator.isTokenSupported(
        srcTokenAddress
      )

      aggregatorResponse[0].should.be.equals(aggregatorAddressToAdd)
      tokenSupportResponse.should.be.true
    })

    it('Should not be able to add an aggregator as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () =>
        chainlinkAggregator
          .connect(notPauser)
          .add(srcTokenAddress, dstTokenAddress, aggregatorAddressToAdd)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('remove', () => {
    const { baseTokenName, quoteTokenName } = chainlink['USDC_ETH']
    const baseTokenAddress = tokens[baseTokenName]
    const quoteTokenAddress = tokens[quoteTokenName]

    it('Should be able remove an aggregator given a token pair as a pauser', async () => {
      // Add aggregator
      await chainlinkAggregator['remove(address,address)'](
        baseTokenAddress,
        quoteTokenAddress
      )

      // Check if aggregator was successfully removed
      const [aggregatorAddress] = await chainlinkAggregator.aggregatorFor(
        baseTokenAddress,
        quoteTokenAddress
      )

      aggregatorAddress.should.be.equal(NULL_ADDRESS)
    })

    it('Should be able remove an aggregator address as a pauser', async () => {
      // Add aggregator
      await chainlinkAggregator['remove(address)'](quoteTokenAddress)

      // Check if aggregator was successfully removed
      const tokenSupportResponse = await chainlinkAggregator.isTokenSupported(
        quoteTokenAddress
      )

      tokenSupportResponse.should.be.false
    })

    it('Should not be able to remove an aggregator as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () =>
        chainlinkAggregator
          .connect(notPauser)
          ['remove(address)'](quoteTokenAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('latestAnswerFor', () => {
    const { baseTokenName, quoteTokenName, address } = chainlink['USDC_ETH']
    const baseTokenAddress = tokens[baseTokenName]
    const quoteTokenAddress = tokens[quoteTokenName]

    beforeEach(async () => {
      await chainlinkAggregator.add(
        baseTokenAddress,
        quoteTokenAddress,
        address
      )
    })
    it('Should be able get the latest price of a token pair', async () => {
      const answer = await chainlinkAggregator.latestAnswerFor(
        baseTokenAddress,
        quoteTokenAddress
      )

      answer.gt(0).should.be.true
    })
  })
})
