import chai from 'chai'
import { solidity } from 'ethereum-waffle'
import hre from 'hardhat'
import { Escrow, Aave, ERC20Detailed, IAToken } from '../../types/typechain'
import { BigNumberish, Signer } from 'ethers'
import { getTokens } from '../../config/tokens'
import { Network } from '../../types/custom/config-types'
import { createMarketWithLoan, LoanType } from '../fixtures'

chai.should()
chai.use(solidity)

interface TestSetupReturn {
  escrow: Escrow
  user: Signer
  aave: Aave
  dai: ERC20Detailed
  aDai: IAToken
}

const {
  deployments,
  contracts,
  getNamedSigner,
  fastForward,
  toBN,
  ethers,
} = hre

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

    const dai = await contracts.get<ERC20Detailed>('ERC20Detailed', {
      at: getTokens(<Network>hre.network.name).DAI,
    })
    const aDai = await contracts.get<IAToken>('IAToken', {
      at: getTokens(<Network>hre.network.name).ADAI,
    })
    const aave = await contracts.get<Aave>('Aave')

    return {
      escrow,
      user,
      aave,
      dai,
      aDai,
    }
  }
)

describe('Aave', async () => {
  let escrow: Escrow
  let user: Signer
  let rando: Signer
  let aave: Aave
  let dai: ERC20Detailed
  let aDai: IAToken
  let amount: BigNumberish
  let tokens: string[]

  beforeEach(async () => {
    // Set up
    ;({ escrow, user, aave, dai, aDai } = await setUpTest())
    amount = toBN('500', '18')
    rando = await getNamedSigner('liquidator')
  })

  describe('deposit, withdraw', () => {
    it('Should be able to deposit and then withdraw successfully from Aave', async () => {
      await escrow.connect(user).callDapp({
        location: aave.address,
        data: aave.interface.encodeFunctionData('deposit', [
          dai.address,
          amount,
        ]),
      })

      let daiBalance = (await dai.balanceOf(escrow.address)).toString()
      let aDaiBalance = (await aDai.balanceOf(escrow.address)).toString()

      aDaiBalance.should.not.equals('0')

      tokens = await escrow.connect(user).getTokens()
      tokens.should.include(aDai.address)

      await fastForward(10000)

      await escrow.connect(user).callDapp({
        location: aave.address,
        data: aave.interface.encodeFunctionData('withdrawAll', [dai.address]),
      })

      tokens = await escrow.connect(user).getTokens()
      tokens.should.not.include(aDai.address)

      aDaiBalance = (await aDai.balanceOf(escrow.address)).toString()
      aDaiBalance.should.equals('0')
    })

    it('Should not be able to deposit into Aave as not the loan borrower', async () => {
      await escrow
        .connect(rando)
        .callDapp({
          location: aave.address,
          data: aave.interface.encodeFunctionData('deposit', [
            dai.address,
            amount,
          ]),
        })
        .should.rejectedWith('NOT_BORROWER')
    })
  })
})
