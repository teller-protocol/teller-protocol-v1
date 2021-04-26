import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import { BigNumberish, Signer } from 'ethers'
import hre from 'hardhat'
import moment from 'moment'

import { getMarkets } from '../../config'
import { Market } from '../../types/custom/config-types'
import {
  ERC20,
  ICErc20,
  ILoansEscrow,
  ITellerDiamond,
} from '../../types/typechain'
import { fundedMarket } from '../fixtures'
import {
  createLoan,
  CreateLoanReturn,
  LoanHelpersReturn,
  LoanType,
} from '../helpers/loans'

chai.should()
chai.use(solidity)

const { getNamedSigner, getNamedAccounts, contracts, tokens, evm, toBN } = hre

describe.only('CompoundDapp', () => {
  getMarkets(hre.network).forEach(testCompound)

  function testCompound(market: Market): void {
    let diamond: ITellerDiamond
    let lendingToken: ERC20
    let cToken: ICErc20

    before(async () => {
      await hre.deployments.fixture(['markets'])
      diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

      lendingToken = await tokens.get(market.lendingToken)
      cToken = await contracts.get<ICErc20>('ICErc20', {
        at: await diamond.getAssetCToken(lendingToken.address),
      })
    })

    beforeEach(async () => {
      await fundedMarket({ assetSym: market.lendingToken, amount: 1000 })
    })

    const testSetup = async (): Promise<LoanHelpersReturn> => {
      // Advance time
      await evm.advanceTime(moment.duration(1, 'day'))

      const duration = moment.duration(2, 'days')

      const loan = async (amount: BigNumberish): Promise<CreateLoanReturn> => {
        const { borrower } = await getNamedAccounts()
        return await createLoan({
          lendTokenSym: market.lendingToken,
          collTokenSym: market.collateralTokens[0],
          amount,
          borrower,
          loanType: LoanType.UNDER_COLLATERALIZED,
          duration,
        })
      }

      const amount = toBN(100, await lendingToken.decimals())
      const { getHelpers } = await loan(amount)
      const helpers = await getHelpers()

      // Deposit collateral needed
      await helpers.collateral.deposit(await helpers.collateral.needed())

      // Advance time
      await evm.advanceTime(moment.duration(5, 'minutes'))

      // Take out loan
      await helpers
        .takeOut()
        .should.emit(diamond, 'LoanTakenOut')
        .withArgs(
          helpers.details.loan.id,
          helpers.details.borrower.address,
          amount
        )

      helpers.details = await helpers.details.refresh()

      return helpers
    }

    describe('lend, redeemAll', () => {
      it('Should be able to lend and then redeem successfully from Compound', async () => {
        const { details } = await testSetup()
        await diamond
          .connect(details.borrower.signer)
          .compoundLend(
            details.loan.id,
            details.loan.lendingToken,
            details.loan.borrowedAmount
          )

        const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

        let cDaiBalance = await cToken.balanceOf(escrowAddress)

        cDaiBalance.eq(0).should.eql(false, '')

        let tokenAddresses: string[]
        tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
        console.log(tokenAddresses)
        tokenAddresses.should.include(cToken.address)

        await diamond
          .connect(details.borrower.signer)
          .compoundRedeemAll(details.loan.id, lendingToken.address)

        tokenAddresses = await diamond.getEscrowTokens(details.loan.id)
        console.log(tokenAddresses)
        tokenAddresses.should.not.include(cToken.address)

        cDaiBalance = await cToken.balanceOf(escrowAddress)
        cDaiBalance.eq(0).should.eql(true, '')
      })

      it('Should not be able to lend into Compound as not the loan borrower', async () => {
        const { details } = await testSetup()
        const rando = await getNamedSigner('lender')
        await diamond
          .connect(rando)
          .compoundLend(
            details.loan.id,
            details.loan.lendingToken,
            details.loan.borrowedAmount
          )
          .should.rejectedWith('Teller: dapp not loan borrower')
      })
    })
  }
})
