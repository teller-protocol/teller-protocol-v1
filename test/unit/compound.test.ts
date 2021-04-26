import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'

import {
  ERC20,
  ITellerDiamond,
  ILoansEscrow,
  ICErc20,
} from '../../types/typechain'
import { BigNumberish, Signer } from 'ethers'
import { getMarkets, getTokens } from '../../config'
import { Market } from '../../types/custom/config-types'
import { fundedMarket } from '../fixtures'
import {
  createLoan,
  CreateLoanReturn,
  LoanHelpersReturn,
  LoanType,
} from '../helpers/loans'
import moment from 'moment'

chai.should()
chai.use(solidity)

const { getNamedSigner, getNamedAccounts, contracts, ethers, evm, toBN } = hre

describe('CompoundDapp', async () => {
  getMarkets(hre.network).forEach(testCompound)

  function testCompound(market: Market): void {
    let escrow: ILoansEscrow
    let borrower: Signer
    let rando: Signer
    let diamond: ITellerDiamond
    let dai: ERC20
    let cDai: ICErc20
    let amount: BigNumberish
    let tokens: string[]

    before(async () => {
      await hre.deployments.fixture(['markets', 'nft'])
      borrower = await getNamedSigner('borrower')
      rando = await getNamedSigner('liquidator')
      diamond = await contracts.get<ITellerDiamond>('TellerDiamond')

      dai = await contracts.get<ERC20>('ERC20', {
        at: getTokens(hre.network).erc20.DAI,
      })
      cDai = await contracts.get<ICErc20>('ICErc20', {
        at: getTokens(hre.network).compound.CDAI,
      })
    })

    beforeEach(async () => {
      await fundedMarket({ assetSym: market.lendingToken, amount: 1000 })
    })

    const testSetup = async (): Promise<LoanHelpersReturn> => {
      const duration = moment.duration(2, 'days')

      const loan = async (): Promise<CreateLoanReturn> => {
        return await createLoan({
          lendTokenSym: market.lendingToken,
          collTokenSym: market.collateralTokens[0],
          amount: 100,
          borrower: await borrower.getAddress(),
          loanType: LoanType.ZERO_COLLATERAL,
          duration,
        })
      }

      const { getHelpers } = await loan()
      const helpers = await getHelpers()

      // Deposit collateral needed
      await helpers.collateral.deposit(await helpers.collateral.needed())

      // Advance time
      await evm.advanceTime(moment.duration(5, 'minutes'))

      // Take out loan
      await helpers
        .takeOut()
        .should.emit(diamond, 'LoanTakenOut')
        .withArgs(helpers.details.loan.id, borrower, amount)

      return helpers
    }

    describe('lend, redeemAll', () => {
      it('Should be able to lend and then redeem successfully from Compound', async () => {
        const { details } = await testSetup()
        await diamond
          .connect(borrower)
          .compoundLend(details.loan.id, details.loan.lendingToken, 50)

        const escrowAddress = await diamond.getLoanEscrow(details.loan.id)

        let cDaiBalance = (await cDai.balanceOf(escrowAddress)).toString()

        cDaiBalance.should.not.equals('0')

        tokens = await diamond.getEscrowTokens(details.loan.id)
        tokens.should.include(cDai.address)

        await diamond
          .connect(borrower)
          .compoundRedeemAll(details.loan.id, details.loan.lendingToken)

        tokens = await diamond.getEscrowTokens(details.loan.id)
        tokens.should.not.include(cDai.address)

        cDaiBalance = (await cDai.balanceOf(escrow.address)).toString()
        cDaiBalance.should.equals('0')
      })

      it('Should not be able to lend into Compound as not the loan borrower', async () => {
        const { details } = await testSetup()
        await diamond
          .connect(rando)
          .compoundLend(details.loan.id, details.loan.lendingToken, 50)
          .should.rejectedWith('NOT_BORROWER')
      })
    })
  }
})
