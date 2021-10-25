import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import { Signer } from 'ethers'
import hre from 'hardhat'

import { getTokens } from '../../config'
import { deployChainlinkPricer } from '../../deploy/price-agg'
import { Address } from '../../types/custom/config-types'
import { ERC20, PriceAggregator } from '../../types/typechain'

chai.should()
chai.use(chaiAsPromised)

const { contracts, tokens, deployments, getNamedSigner, toBN } = hre

describe('PriceAggregator', () => {
  let priceAgg: PriceAggregator
  let deployer: Signer

  const tokenAddresses = getTokens(hre.network)
  const pairs = [
    ['dai', 'weth'],
    ['usdc', 'weth'],
    ['link', 'weth'],
  ]

  const getTokenAddress = (sym: string): Address =>
    tokenAddresses.all[sym.toUpperCase()]

  beforeEach(async () => {
    await deployments.fixture('protocol', {
      keepExistingDeployments: false,
    })

    priceAgg = await contracts.get<PriceAggregator>('PriceAggregator')
    deployer = await getNamedSigner('deployer')
  })

  describe('setChainlinkPricer', () => {
    it('Should be able to set a pricer for Chainlink', async () => {
      const chainlinkPricer = await deployChainlinkPricer(hre)

      await priceAgg
        .connect(deployer)
        .setChainlinkPricer(chainlinkPricer.address)
    })

    it('Should not be able to set a pricer for Chainlink that is not a contract', async () => {
      await priceAgg
        .connect(deployer)
        .setChainlinkPricer(await deployer.getAddress())
        .should.be.revertedWith('Teller: Chainlink pricer not contract')
    })

    it('Should not be able to set a pricer for Chainlink as not deployer', async () => {
      const chainlinkPricer = await deployChainlinkPricer(hre)

      const rando = await getNamedSigner('borrower')
      await priceAgg
        .connect(rando)
        .setChainlinkPricer(chainlinkPricer.address)
        .should.be.revertedWith('AccessControl: not authorized')
    })
  })

  describe('setAssetPricer', () => {
    let token: ERC20

    before(async () => {
      token = await hre.tokens.get('DAI')
    })

    it('Should be able to set a pricer for an asset', async () => {
      const chainlinkPricer = await deployChainlinkPricer(hre)

      await priceAgg
        .connect(deployer)
        .setAssetPricer(token.address, chainlinkPricer.address)
    })

    it('Should not be able to set a pricer for an asset that is not a contract', async () => {
      await priceAgg
        .connect(deployer)
        .setAssetPricer(token.address, await deployer.getAddress())
        .should.be.revertedWith('Teller: Chainlink pricer not contract')
    })

    it('Should not be able to set a pricer for an asset as not deployer', async () => {
      const chainlinkPricer = await deployChainlinkPricer(hre)

      const rando = await getNamedSigner('borrower')
      await priceAgg
        .connect(rando)
        .setAssetPricer(token.address, chainlinkPricer.address)
        .should.be.revertedWith('AccessControl: not authorized')
    })
  })

  describe('getPriceFor', () => {
    for (const [base, quote] of pairs) {
      it(`Should be able get the latest price for ${base}/${quote}`, async () => {
        const answer = await priceAgg.getPriceFor(
          getTokenAddress(base),
          getTokenAddress(quote)
        )

        answer.gt(0).should.eql(true, 'Chainlink pair zero price')
      })
    }
  })

  describe('getValueFor', () => {
    for (const [base, quote] of pairs) {
      it(`Should be able get the latest price for ${base}/${quote}`, async () => {
        const answer = await priceAgg.getValueFor(
          getTokenAddress(base),
          getTokenAddress(quote),
          await tokens.get(base).then(async (t) => toBN(1, await t.decimals()))
        )

        answer.gt(0).should.eql(true, 'Chainlink pair zero value')
      })
    }
  })
})
