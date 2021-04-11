import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { PriceAggregator } from '../../types/typechain'
import { NULL_ADDRESS } from '../../utils/consts'
import { getChainlink, getTokens } from '../../config'

chai.should()
chai.use(chaiAsPromised)

const { deployments, ethers, contracts, getNamedSigner } = hre

const setupTest = deployments.createFixture(async () => {
  // Get snapshot
  await deployments.fixture('asset-settings')

  const deployer = await getNamedSigner('deployer')
  const priceAggregator = await contracts.get<PriceAggregator>(
    'PriceAggregator',
    { from: deployer }
  )

  return {
    priceAggregator,
  }
})

describe('PriceAggregator', async () => {
  let priceAggregator: PriceAggregator
  const chainlink = getChainlink(hre.network)
  const tokens = getTokens(hre.network)

  // Setup for global tests
  beforeEach(async () => {
    const setup = await setupTest()

    priceAggregator = setup.priceAggregator
  })

  describe('add', () => {
    let pair = Object.values(chainlink)[0]
    const srcTokenAddress = tokens[pair!.baseTokenName]
    const dstTokenAddress = tokens[pair!.quoteTokenName]
    const aggregatorAddressToAdd = pair!.address

    it('Should be able add an aggregator address as a pauser', async () => {
      // Add aggregator
      await priceAggregator.add(
        srcTokenAddress,
        dstTokenAddress,
        aggregatorAddressToAdd
      )

      // Check if aggregator was successfully added
      const aggregatorResponse: [
        string,
        boolean
      ] = await priceAggregator.aggregatorFor(srcTokenAddress, dstTokenAddress)

      const tokenSupportResponse = await priceAggregator.isTokenSupported(
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
        priceAggregator
          .connect(notPauser)
          .add(srcTokenAddress, dstTokenAddress, aggregatorAddressToAdd)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('remove', () => {
    const { baseTokenName, quoteTokenName } = Object.values(chainlink)[0]
    const baseTokenAddress = tokens[baseTokenName]
    const quoteTokenAddress = tokens[quoteTokenName]

    it('Should be able remove an aggregator given a token pair as a pauser', async () => {
      // Add aggregator
      await priceAggregator['remove(address,address)'](
        baseTokenAddress,
        quoteTokenAddress
      )

      // Check if aggregator was successfully removed
      const [aggregatorAddress] = await priceAggregator.aggregatorFor(
        baseTokenAddress,
        quoteTokenAddress
      )

      aggregatorAddress.should.be.equal(NULL_ADDRESS)
    })

    it('Should be able remove an aggregator address as a pauser', async () => {
      // Add aggregator
      await priceAggregator['remove(address)'](quoteTokenAddress)

      // Check if aggregator was successfully removed
      const tokenSupportResponse = await priceAggregator.isTokenSupported(
        quoteTokenAddress
      )

      tokenSupportResponse.should.be.false
    })

    it('Should not be able to remove an aggregator as not a pauser', async () => {
      // Sender address
      const { 8: notPauser } = await ethers.getSigners()

      // Try to update setting
      const fn = () =>
        priceAggregator.connect(notPauser)['remove(address)'](quoteTokenAddress)

      await fn().should.be.rejectedWith('NOT_PAUSER')
    })
  })

  describe('latestAnswerFor', () => {
    const pair = Object.values(chainlink)[0]
    const baseTokenAddress = tokens[pair.baseTokenName]
    const quoteTokenAddress = tokens[pair.quoteTokenName]

    beforeEach(async () => {
      await priceAggregator.add(
        baseTokenAddress,
        quoteTokenAddress,
        pair.address
      )
    })
    it('Should be able get the latest price of a token pair', async () => {
      const answer = await priceAggregator.latestAnswerFor(
        baseTokenAddress,
        quoteTokenAddress
      )

      answer.gt(0).should.be.true
    })
  })
})
