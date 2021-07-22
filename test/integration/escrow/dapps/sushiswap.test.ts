import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'

import { getMarkets } from '../../../../config'
import { getPlatformSetting } from '../../../../tasks'
import { Market } from '../../../../types/custom/config-types'
import { ERC20, ITellerDiamond } from '../../../../types/typechain'
import { fundedMarket } from '../../../fixtures'
import { LoanType, takeOutLoanWithoutNfts } from '../../../helpers/loans'

chai.should()
chai.use(solidity)

const { tokens, getNamedSigner, evm } = hre

describe.skip('SushiswapDapp', () => {
  let diamond: ITellerDiamond
  let lendingToken: ERC20
  let link: ERC20

  getMarkets(hre.network).forEach(testSushiswap)

  function testSushiswap(market: Market): void {
    describe(`${market.lendingToken} lending token`, () => {
      before(async () => {
        ({ diamond, lendingToken } = await fundedMarket({
          assetSym: market.lendingToken,
          amount: 100000,
          keepExistingDeployments: false
        }))

        link = await tokens.get('LINK')
      })

      beforeEach(async () => {
        // Advance time
        const { value: rateLimit } = await getPlatformSetting(
          'RequestLoanTermsRateLimit',
          hre
        )
        await evm.advanceTime(rateLimit)
      })

      describe('swap', () => {
        it('Should be able to swap using Sushiswap', async () => {
          const { getHelpers } = await takeOutLoanWithoutNfts({
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
          })
          const { details } = await getHelpers()

          const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

          const lendingBalBefore = await lendingToken.balanceOf(escrowAddress)
          lendingBalBefore
            .gt(0)
            .should.eql(true, 'Loan escrow should have a lending token balance')

          const swapBalBefore = await link.balanceOf(escrowAddress)
          swapBalBefore
            .eq(0)
            .should.eql(
              true,
              'Loan escrow should not have a token balance before swap'
            )

          await diamond
            .connect(details.borrower.signer)
            .sushiswapSwap(
              details.loan.id,
              [lendingToken.address, link.address],
              lendingBalBefore,
              '0'
            )
            .should.emit(diamond, 'SushiswapSwapped')

          const swapBalAfter = await link.balanceOf(escrowAddress)
          swapBalAfter
            .gt(0)
            .should.eql(true, 'Swap token balance not positive after swap')

          const lendingBalAfter = await lendingToken.balanceOf(escrowAddress)
          lendingBalAfter
            .eq(0)
            .should.eql(
              true,
              'Loan escrow has lending token balance after swapping full amount'
            )
        })

        it('Should NOT be able to swap using Sushiswap as not the loan borrower', async () => {
          const { getHelpers } = await takeOutLoanWithoutNfts({
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
            amount: 100,
          })
          const { details } = await getHelpers()

          await diamond
            .connect(await getNamedSigner('deployer'))
            .sushiswapSwap(
              details.loan.id,
              [lendingToken.address, link.address],
              details.loan.borrowedAmount,
              '0'
            )
            .should.rejectedWith('Teller: dapp not loan borrower')
        })

        it.skip('Should NOT be able to swap using Sushiswap with an unsecured loan', async () => {
          const { getHelpers } = await takeOutLoanWithoutNfts({
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.ZERO_COLLATERAL,
            amount: 100,
          })
          const { details } = await getHelpers()

          await diamond
            .connect(details.borrower.signer)
            .sushiswapSwap(
              details.loan.id,
              [lendingToken.address, link.address],
              details.loan.borrowedAmount,
              '0'
            )
            .should.rejectedWith('Teller: dapp loan not secured')
        })
      })
    })
  }
})
