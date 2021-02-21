import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import {
  createAndGetLoan,
  createLoan,
  createMarketWithLoan,
  MarketWithLoanReturn,
} from '../fixtures'
import { Signer } from 'ethers'

chai.should()
chai.use(chaiAsPromised)

const { deployments, getNamedSigner, ethers } = hre

const setupTest = deployments.createFixture(async () => {
  const market = await createMarketWithLoan({
    market: {
      market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
    },
    borrower: await getNamedSigner('borrower'),
    loanType: 2,
  })
  // Forward timestamp by a day to be able to take out subsequent loans
  await hre.fastForward(90000)

  return {
    ...market,
  }
})

describe('Loans', async () => {
  let market: MarketWithLoanReturn
  let borrower: Signer

  // Setup for global tests
  beforeEach(async () => {
    // Execute snapshot and setup for tests
    borrower = await getNamedSigner('borrower')
    market = await setupTest()
  })

  describe('createLoanWithTerms', () => {
    it('should be able to create a loan with terms', async () => {
      const createdLoanID = await createLoan(market, 2, '2000', borrower)
      createdLoanID.should.be.equals('1') // Second created loan after the one craeted in setup()
    })
  })
})
