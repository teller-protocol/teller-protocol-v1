import chai from 'chai'
import chaiAsPromised from 'chai-as-promised'
import hre from 'hardhat'
import { marketWithLoan, MarketWithLoanReturn } from '../fixtures'
import { mockCRAResponse } from '../../utils/mock-cra-response'
import { ONE_DAY } from '../../utils/consts'
import { Signer } from 'ethers'

chai.should()
chai.use(chaiAsPromised)

const { deployments, getNamedSigner, ethers } = hre

const setupTest = deployments.createFixture(async () => {
  const market = await marketWithLoan({
    market: {
      market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
    },
    borrower: await getNamedSigner('borrower'),
    loanType: 2,
  })

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
      const { request, response } = await mockCRAResponse({
        lendingToken: market.lendTokenSym,
        collateralToken: market.collTokenSym,
        loanAmount: '100000000000',
        loanTermLength: ONE_DAY.toString(),
        collateralRatio: '5000',
        interestRate: '400',
        borrower: await borrower.getAddress(),
      })
      const collateralAmount = '100000000000000000'
      await market.loans
        .connect(borrower)
        .createLoanWithTerms(request, [response], collateralAmount, {
          value: collateralAmount,
        })
    })
  })
})
