import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { Escrow, YearnDapp } from '../../types/typechain'
import { BigNumberish, Signer } from 'ethers'
import { createMarketWithLoan, LoanType } from '../fixtures'
import { getTokens } from '../../config'

chai.should()
chai.use(solidity)

interface TestSetupReturn {
  escrow: Escrow
  user: Signer
  yearn: YearnDapp
  daiAddress: string
  yDaiAddress: string
}

const { deployments, contracts, getNamedSigner, fastForward } = hre

const setUpTest = deployments.createFixture(
  async (): Promise<TestSetupReturn> => {
    const user = await getNamedSigner('borrower')
    const market = await createMarketWithLoan({
      market: {
        market: { lendTokenSym: 'DAI', collTokenSym: 'ETH' },
      },
      borrower: user,
      loanType: LoanType.UNDER_COLLATERALIZED,
    })

    const loan = await market.loanManager.loans(market.createdLoanId)

    const escrow = await contracts.get<Escrow>('Escrow', { at: loan.escrow })

    const daiAddress = getTokens(hre.network).DAI
    const yDaiAddress = getTokens(hre.network).YDAI
    const yearn = await contracts.get<YearnDapp>('YearnDapp')

    return {
      escrow,
      user,
      yearn,
      daiAddress,
      yDaiAddress,
    }
  }
)

describe('YearnDapp', async () => {
  let escrow: Escrow
  let user: Signer
  let rando: Signer
  let yearn: YearnDapp
  let daiAddress: string
  let yDaiAddress: string
  let amount: BigNumberish
  let tokens: string[]

  beforeEach(async () => {
    // Set up
    ;({ escrow, user, yearn, daiAddress, yDaiAddress } = await setUpTest())
    amount = '500'
    rando = await getNamedSigner('liquidator')
  })

  describe('deposit and withdraw from yearn', () => {
    it('Should be able to deposit and then withdraw successfully from a yearn vault', async () => {
      await escrow.connect(user).callDapp({
        location: yearn.address,
        data: yearn.interface.encodeFunctionData('deposit', [
          daiAddress,
          amount,
        ]),
      })

      tokens = await escrow.connect(user).getTokens()

      await fastForward(10000)

      await escrow.connect(user).callDapp({
        location: yearn.address,
        data: yearn.interface.encodeFunctionData('withdrawAll', [daiAddress]),
      })
    })

    it('Should not be able to deposit from a yearn vault as not the loan borrower', async () => {
      await escrow
        .connect(rando)
        .callDapp({
          location: yearn.address,
          data: yearn.interface.encodeFunctionData('deposit', [
            daiAddress,
            amount,
          ]),
        })
        .should.revertedWith('NOT_BORROWER')
    })
  })
})
