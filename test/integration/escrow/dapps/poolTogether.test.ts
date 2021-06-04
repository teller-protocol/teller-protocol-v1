import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre, { ethers } from 'hardhat'

import { getMarkets } from '../../../../config'
import { getPlatformSetting } from '../../../../tasks'
import { Market } from '../../../../types/custom/config-types'
import { ERC20, IAToken, ITellerDiamond } from '../../../../types/typechain'
import { fundedMarket } from '../../../fixtures'
import { LoanType, takeOut } from '../../../helpers/loans'

chai.should()
chai.use(solidity)

const { getNamedSigner, contracts, evm } = hre

describe.only('poolTogether Dapp', () => {
  getMarkets(hre.network).forEach(testPoolTogether)

  function testPoolTogether(market: Market): void {
    describe(`${market.lendingToken} lending token`, () => {
      let diamond: ITellerDiamond
      let lendingToken: ERC20

      before(async () => {
        const deployer = await getNamedSigner('deployer')
        const balance = await hre.ethers.provider.getBalance(
          await deployer.getAddress()
        )
        console.log({ balance: ethers.utils.formatEther(balance) })
        ;({ diamond, lendingToken } = await fundedMarket({
          assetSym: market.lendingToken,
          amount: 100,
        }))
      })

      beforeEach(async () => {
        // Advance time
        const { value: rateLimit } = await getPlatformSetting(
          'RequestLoanTermsRateLimit',
          hre
        )
        console.log('rate lomit: %o', rateLimit.toString())
        await evm.advanceTime(rateLimit)
      })

      describe('deposit, withdrawAll', () => {
        it('Should be able to deposit and then withdraw successfully from poolTogether', async () => {
          const { details } = await takeOut({
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
          })
          console.log('details: %o', details)
          await diamond
            .connect(details.borrower.signer)
            .poolTogetherDepositTicket(
              details.loan.id,
              details.loan.lendingToken,
              details.loan.borrowedAmount
            )

          const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

          let daiBalance = await lendingToken.balanceOf(escrowAddress)

          daiBalance.eq(0).should.eql(false, '')

          let tokenAddresses: string[]
          tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
          tokenAddresses.should.include(lendingToken.address)

          await diamond
            .connect(details.borrower.signer)
            .poolTogetherWithdrawAll(details.loan.id, lendingToken.address)

          tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
          tokenAddresses.should.not.include(lendingToken.address)

          daiBalance = await lendingToken.balanceOf(escrowAddress)
          daiBalance.eq(0).should.eql(true, '')
        })

        it('Should not be able to deposit into pooltogether as not the loan borrower', async () => {
          const { details } = await takeOut({
            lendToken: market.lendingToken,
            collToken: market.collateralTokens[0],
            loanType: LoanType.UNDER_COLLATERALIZED,
          })

          const rando = await getNamedSigner('lender')
          await diamond
            .connect(rando)
            .poolTogetherDepositTicket(
              details.loan.id,
              details.loan.lendingToken,
              details.loan.borrowedAmount
            )
            .should.rejectedWith('Teller: dapp not loan borrower')
        })
      })
    })
  }
})
