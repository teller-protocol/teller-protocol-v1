import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { BigNumber, Signer } from 'ethers'
import { ERC20Detailed, TToken } from '../../types/typechain'
import { fundedMarket, FundedMarketReturn } from '../fixtures'
import { getFunds } from '../../utils/get-funds'

chai.should()
chai.use(solidity)

const { deployments, getNamedSigner, contracts, fastForward, BN } = hre

const setupTest = deployments.createFixture(async () => {
  await deployments.fixture('markets')

  const deployer = await getNamedSigner('deployer')
  const lender = await getNamedSigner('lender')

  // Fund market
  const market = await fundedMarket({ amount: 50000 })

  // Load lending token contract
  const lendingTokenAddress = await market.lendingPool.lendingToken()
  const lendingToken = await contracts.get<ERC20Detailed>('ERC20Detailed', {
    at: lendingTokenAddress,
  })

  // Load lending token contract
  const tTokenAddress = await market.lendingPool.tToken()
  const tToken = await contracts.get<TToken>('TToken', { at: tTokenAddress })

  return {
    market,
    deployer,
    lender,
    lendingToken,
    tToken,
  }
})

describe('LendingPool', async () => {
  let market: FundedMarketReturn
  let lender: Signer
  let deployer: Signer
  let lendingToken: ERC20Detailed
  let tToken: TToken
  let lendingTokenDecimals: string
  let depositAmount: BigNumber
  let tTokenAmount: BigNumber
  let lenderAddress: string
  let exchangeRate: BigNumber
  let exchangeRateDecimals: number

  // Setup for global tests
  beforeEach(async () => {
    // Execute snapshot and setup for tests
    ;({ market, deployer, lender, lendingToken, tToken } = await setupTest())
    lenderAddress = await lender.getAddress()
    // Set up values
    lendingTokenDecimals = (await lendingToken.decimals()).toString()
    exchangeRateDecimals = await market.lendingPool.EXCHANGE_RATE_DECIMALS()
    exchangeRate = await market.lendingPool.exchangeRate()
    const amount = '1000'
    depositAmount = BN(amount, lendingTokenDecimals)
    tTokenAmount = depositAmount
      .mul(BN('1', exchangeRateDecimals.toString()))
      .div(exchangeRate)

    // Get lender DAI to deposit
    await getFunds({
      to: lender,
      tokenSym: market.lendTokenSym,
      amount: BN('2000', lendingTokenDecimals),
    })
  })

  describe('deposit', () => {
    it('should be able deposit and withdraw with interest', async function () {
      // Approve deposit
      const lendingPoolAddress = market.lendingPool.address
      await lendingToken
        .connect(lender)
        .approve(lendingPoolAddress, depositAmount)

      // Deposit into lending pool
      await market.lendingPool
        .connect(lender)
        .deposit(depositAmount)
        .should.emit(market.lendingPool, 'TokenDeposited')
        .withArgs(await lender.getAddress(), depositAmount, tTokenAmount)

      // Fast forward block timestamp by 10 weeks
      await fastForward(6048000)

      // Get tToken balance
      const tTokenBalance = await tToken.balanceOf(lenderAddress)
      // Get updated exchange rate after deposit
      const updatedExchangeRate = await market.lendingPool.exchangeRate()
      // Get lending tokens for tToken
      const lendingTtokens = tTokenBalance
        .mul(updatedExchangeRate)
        .div(BN('1', exchangeRateDecimals.toString()))

      // Withdraw loan
      await market.lendingPool
        .connect(lender)
        .withdrawAll()
        .should.emit(market.lendingPool, 'TokenWithdrawn')
        .withArgs(lenderAddress, lendingTtokens, tTokenBalance)
    })
  })
})
